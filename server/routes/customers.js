import express from "express";
import { verifyStaff, verifyToken } from "../middleware/auth.js";
import {
    getAllCustomers,
    getCustomerById,
    getCustomerByEmail,
    getCurrentCustomer,
    updateCurrentCustomer,
    updateCustomerPassword,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerStats,
    updateMembership,
    forceRemoveMembership,
    getMembershipHistory,
    getEmailPreferences,
    updateEmailPreferences
} from "../controllers/customerController.js";

const router = express.Router();

// Authenticated customer route: users can only view their own profile;
// prevents profile enumeration and cross-customer data leakage
router.get("/me", verifyToken, getCurrentCustomer);
router.put("/me", verifyToken, updateCurrentCustomer);
router.put("/me/password", verifyToken, updateCustomerPassword);
router.get("/me/email-preferences", verifyToken, getEmailPreferences);
router.put("/me/email-preferences", verifyToken, updateEmailPreferences);

// Admin management routes: staff can view all profiles, reset passwords, and manage accounts
router.post("/", verifyToken, verifyStaff, createCustomer);
router.get("/email/:email", verifyToken, verifyStaff, getCustomerByEmail);
router.get("/", verifyToken, verifyStaff, getAllCustomers);
router.get("/stats", verifyToken, verifyStaff, getCustomerStats);
router.get("/:id", verifyToken, verifyStaff, getCustomerById);
router.put("/:id", verifyToken, verifyStaff, updateCustomer);
router.put("/:id/membership", verifyToken, verifyStaff, updateMembership);
router.get("/:id/membership/history", verifyToken, verifyStaff, getMembershipHistory);
router.post("/:id/membership/force-remove", verifyToken, verifyStaff, forceRemoveMembership);
router.delete("/:id", verifyToken, verifyStaff, deleteCustomer);

export default router;
