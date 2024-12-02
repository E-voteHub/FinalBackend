
import mongoose from "mongoose";

const RegisteredUserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true, // Ensures no duplicate usernames
    trim: true, // Removes unnecessary spaces
  },
  FullName: {
    type: String,
    required: true,
    trim: true,
  },
  Age: {
    type: Number,
    required: true,
    min: 0, // Ensures no negative age
  },
  DOB: {
    type: Date,
    required: true,
  },
  PhoneNo: {
    type: String,
    required: true,
    match: /^[0-9]{10}$/, // Validates a 10-digit phone number
  },
  AadharNo: {
    type: String,
    required: true,
    match: /^[0-9]{12}$/, // Validates a 12-digit Aadhar number
    unique: true, // Ensures no duplicate Aadhar numbers
  },
  VoterID: {
    type: String,
    required: true,
    unique: true, // Ensures no duplicate Voter IDs
  },
  uniqueKey: {
    type: String,
    required: true,
    unique: true, // Ensures no duplicate keys
  },
  hasVoted :{
    type : Boolean
  }
}, { timestamps: true }); // Automatically adds createdAt and updatedAt fields


const RegisteredUser = mongoose.model('RegisteredUser', RegisteredUserSchema);

 export default RegisteredUser;
