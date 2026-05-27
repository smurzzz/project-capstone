import express from 'express';
import {
    getCurrentSession,
    googleCustomerAuth,
    loginCustomer,
    loginStaff,
    registerCustomer,
    Login,
} from "../controllers/authController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Customer auth routes
router.post("/customer/login", loginCustomer);
router.post("/customer/register", registerCustomer);
router.post("/google/customer", googleCustomerAuth);

// Staff auth routes
router.post("/staff/login", loginStaff);
router.get("/session", verifyToken, getCurrentSession);

// Legacy route
router.post('/login', Login); 

export default router;
