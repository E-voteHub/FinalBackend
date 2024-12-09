import express from 'express';
import crypto from 'crypto';
import { createBlock, getLastBlock } from '../utils/blockchainUtils.js';
import Transaction from '../models/Transaction.js';
import RegisteredUser from '../models/RegisteredUser.js';
import Block from '../models/Block.js';

const router = express.Router();

router.post('/', async (req, res) => {
    const { username, candidateId } = req.body;

    try {
        // Check if the user has already voted
        const existingTransaction = await Transaction.findOne({ voterUsername: username });
        if (existingTransaction) {
            return res.status(400).send('You have already voted.');
        }

        // Create a new transaction
        const transaction = new Transaction({ voterUsername: username, candidateId });
        await transaction.save();
        console.log(`Transaction saved: ${transaction}`);

        // Ensure the genesis block is created if no blocks exist
        let lastBlock = await getLastBlock();
        if (!lastBlock) {
            console.log('No blocks found, creating genesis block');
            const genesisBlock = new Block({
                index: 0,
                transactions: [],
                previousHash: '0',
                hash: crypto.createHash('sha256').update('genesis block').digest('hex')
            });
            await genesisBlock.save();
            console.log('Genesis block created:', genesisBlock);
            lastBlock = genesisBlock;
        }
        console.log(`Last block: ${lastBlock}`);

        // Create a new block
        const newBlock = await createBlock([transaction], lastBlock.hash);
        if (newBlock) {
            console.log(`New block created: ${newBlock}`);

            // Update the registered user status
            try {
                await RegisteredUser.updateOne({ username: username }, { hasVoted: true });
                console.log(`User ${username} has voted.`);
                res.send('Vote recorded successfully.');
            } catch (error) {
                console.error("Error updating Registered User:", error);
                res.status(500).send("Please contact support to manually override your information.");
            }
        } else {
            res.status(500).send("Error creating the block.");
        }
    } catch (error) {
        console.error("Error in voting process:", error);
        res.status(500).send("Error processing the vote.");
    }
});

export default router;





// import express from 'express';
// import { createBlock, getLastBlock } from '../utils/blockchainUtils.js';
// import Transaction from '../models/Transcation.js';
// import RegisteredUser from '../models/RegisteredUser.js';

// const router = express.Router();

// router.post('/', async (req, res) => {
//     const { username , candidateId } = req.body;

//     try {
//         const existingTransaction = await Transaction.findOne({ username });
//         if (existingTransaction) {
//             return res.status(400).send('You have already voted.');
//         }

//         const transaction = new Transaction({ username, candidateId });
//         await transaction.save();

//         const lastBlock = await getLastBlock();
//         console.log((lastBlock));
        
//         const newBlock = await createBlock([transaction], lastBlock.hash);

//         if (newBlock) {
//             try {
//                 await RegisteredUser.updateOne({ username: username }, { hasVoted: true });
//                 res.send('Vote recorded successfully.');
//             } catch (error) {
//                 console.error("Error updating Registered User:", error);
//                 res.status(500).send("Please contact support to manually override your information.");
//             }
//         } else {
//             res.status(500).send("Error creating the block.");
//         }
//     } catch (error) {
//         console.error("Error creating the hash in vote.js:", error);
//         res.status(500).send("Error creating the hash.");
//     }
// });

// export default router;
