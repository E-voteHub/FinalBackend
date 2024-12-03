import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    role: { type: String, enum: ['admin'], default: 'admin' },
    createdAt: { type: Date, default: Date.now },
    password: { type: String, required: true }
}, { timestamps: true });





const Admin = mongoose.model('Admin', adminSchema);

export default Admin;
