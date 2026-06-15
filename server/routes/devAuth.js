<<<<<<< HEAD
import express from 'express';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import { signAuthToken } from '../middleware/auth.js';

const router = express.Router();

// Development-only endpoint to create or get a dev user and return a session token
router.post('/dev-signin', async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({ success: false, message: 'Not allowed in production' });
        }

        const email = (req.body?.email || 'dev@local').toLowerCase();
        let user = await User.findOne({ email });

        if (!user) {
            const customer = await Customer.create({
                name: 'Dev Customer',
                contactInfo: { email },
                role: 'Guest',
                membership: { status: 'None' }
            });

            user = await User.create({
                name: 'Dev Customer',
                email,
                role: 'customer',
                customerId: customer._id,
                emailVerified: true,
                authProvider: 'password'
            });
        }

        const token = signAuthToken({ id: user._id, role: user.role, type: 'customer' });

        return res.json({ success: true, token, user: { id: user._id, email: user.email, name: user.name } });
    } catch (err) {
        console.error('[dev-signin] error', err);
        return res.status(500).json({ success: false, message: 'Dev sign-in failed' });
    }
});

export default router;
=======
import express from "express"
import { Login, loginCustomer, loginStaff } from "../controllers/authController.js"

const router = express.Router()

// Development compatibility routes.
// Kept intentionally small so older deployments that still import this module
// can boot successfully while continuing to use the normal auth controllers.
router.post("/login", Login)
router.post("/customer/login", loginCustomer)
router.post("/staff/login", loginStaff)

export default router
>>>>>>> d0494e27550d9821133821940597591149159e0d
