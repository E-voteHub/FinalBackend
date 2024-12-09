import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema({
    voterUsername : String,
    candidateId : String
},{timestamps:true})

const Transaction = new mongoose.model('Transaction', TransactionSchema)

export default Transaction

