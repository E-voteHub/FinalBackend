import express from 'express';
import bcrypt from 'bcryptjs';
import Admin from '../models/AdminSchema.js';

const router = express.Router();
const saltRounds = 15;

router.post('/admin/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new admin instance with username and hashed password
        const admin = new Admin({ username, password: hashedPassword });

        // Save the admin to the database
        await admin.save();

        console.log('Admin registered successfully:', admin);
        res.status(201).send('Admin registered successfully');
    } catch (error) {
        console.error("Error registering admin:", error);
        res.status(500).send(error.message);
    }
});

export default router;
