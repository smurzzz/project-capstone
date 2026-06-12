import express from 'express';
import {
    getCurrentSession,
    googleCustomerAuth,
    loginCustomer,
    loginStaff,
    registerCustomer,
    Login,
} from "../controllers/authController.js";
import {
    requestOtpVerification,
    requestPasswordReset,
    resetPassword,
    verifyOtp,
} from "../controllers/mailController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Customer authentication paths: supports both traditional and OAuth login;
// allows flexible authentication strategies for different user cohorts
router.post("/customer/login", loginCustomer);
router.post("/customer/register", registerCustomer);
router.post("/google/customer", googleCustomerAuth);
router.post("/otp/request", requestOtpVerification);
router.post("/otp/verify", verifyOtp);
router.post("/password/forgot", requestPasswordReset);
router.post("/password/reset", resetPassword);

// Staff authentication: separate from customer paths to apply different
// rate limiting and require stronger credentials for privileged access
router.post("/staff/login", loginStaff);
router.get("/session", verifyToken, getCurrentSession);

// Legacy endpoint: maintained for backward compatibility with older clients
router.post('/login', Login); 

export default router;
