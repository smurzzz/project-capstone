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

router.use((req, _res, next) => {
    console.log(`[AUTH] ${req.method} ${req.originalUrl}`);
    next();
});

// Customer auth routes
router.post("/customer/login", loginCustomer);
router.post("/customer/register", registerCustomer);
router.post("/google/customer", googleCustomerAuth);
router.post("/otp/request", requestOtpVerification);
router.post("/otp/verify", verifyOtp);
router.post("/password/forgot", requestPasswordReset);
router.post("/password/reset", resetPassword);

// Staff auth routes
router.post("/staff/login", loginStaff);
router.get("/session", verifyToken, getCurrentSession);

// Legacy route
router.post('/login', Login); 

export default router;
