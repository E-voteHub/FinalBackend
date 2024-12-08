import mongoose from "mongoose";
import passportLocalMongoose from 'passport-local-mongoose'
const Schema = mongoose.Schema;

// Dont worry you can steal this schema but dont mess my project
const UserSchema = new Schema({
    username: { type: String, unique: true, required: true },
    Email: {
        type: String,
        required : true,
        unique: true,
        trim: true,
        lowercase: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});




UserSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', UserSchema);

export default User