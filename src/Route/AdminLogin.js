import express from 'express';
import bcrypt from 'bcryptjs';
import Admin from '../models/AdminSchema.js';

const router = express.Router();

router.post("/admin/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find admin by username
        const admin = await Admin.findOne({ username });

        if (!admin) {
            return res.status(401).json({ success: false, message: 'Authentication failed. Admin not found.' });
        }

        console.log('Entered Password:', password);
        console.log('Stored Hashed Password:', admin.password);

        // Compare provided password with stored hash
        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            console.log('Passwords do not match.');
            return res.status(401).json({ success: false, message: 'Authentication failed. Incorrect password.' });
        }

        // Successful login
        req.session.user = admin;
        res.json({ success: true, message: 'Admin login successful', username: admin.username });
    } catch (error) {
        console.error("Error in admin login route:", error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

export default router;
