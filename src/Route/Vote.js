import express from 'express';
import { createBlock, getLastBlock } from '../utils/blockchainUtils.js';
import Transaction from '../models/Transcation.js';
import RegisteredUser from '../models/RegisteredUser.js';

const router = express.Router();

router.post('/', async (req, res) => {
    const { voterId, candidateId } = req.body;

    try {
        const existingTransaction = await Transaction.findOne({ voterId });
        if (existingTransaction) {
            return res.status(400).send('You have already voted.');
        }

        const transaction = new Transaction({ voterId, candidateId });
        await transaction.save();

        const lastBlock = await getLastBlock();
        const newBlock = await createBlock([transaction], lastBlock.hash);

        if (newBlock) {
            try {
                await RegisteredUser.updateOne({ VoterID: voterId }, { hasVoted: true });
                res.send('Vote recorded successfully.');
            } catch (error) {
                console.error("Error updating Registered User:", error);
                res.status(500).send("Please contact support to manually override your information.");
            }
        } else {
            res.status(500).send("Error creating the block.");
        }
    } catch (error) {
        console.error("Error creating the hash in vote.js:", error);
        res.status(500).send("Error creating the hash.");
    }
});

export default router;
