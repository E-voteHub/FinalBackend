import mongoose from "mongoose";

const BlockSchema = new mongoose.Schema({
    index : Number,
    transactions : Array,
    previousHash: String,
    hash:String
},{timestamps: true});

const Block = mongoose.model('Block',BlockSchema)

export default Block