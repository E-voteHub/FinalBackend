import mongoose from "mongoose";
// import { stringify } from "uuid";

const CandidateSchema = new mongoose.Schema({

    username:{
        type : String,
        required : true
    },
    party : {
        type : String,
        required : true
    },
    candidateName : {
        type : String,
        required : true
    },
    voterID :{
        type : String,
        required : true,
        unique : true
    },
    gender : {
        type : String,
        required : true
    },
    photo : {
        //type : Buffer,
        type : String,
        required: true

    },
    isSelected :{
        type : Boolean,
        
    }

}, {timestamps : true})

const Candidate  =  mongoose.model('Candidate', CandidateSchema)

export default Candidate


// const candidateSchema = new mongoose.Schema({ party: String, candidateName: String, voterID: String, gender: String, photo: Buffer // Store the photo as a Buffer });