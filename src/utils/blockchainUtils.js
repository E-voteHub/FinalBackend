import Block from '../models/Block.js'
import crypto from 'crypto'

async function createBlock(transactions,previousHash){
    const block = new Block({
        index:(await Block.countDocuments()),
        timestamp: new Date(),
        transactions,
        previousHash,
        hash: crypto.createHash('sha256').update(JSON.stringify(transactions)+previousHash).digest('hex')
    });
    await block.save();
    return block;
}

async function getLastBlock(){
    const response =  await Block.findOne().sort({index :-1});
    console.log(response);
    
    return response
}

export {createBlock , getLastBlock};