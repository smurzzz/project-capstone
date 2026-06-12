import express from "express";
import { verifyAdmin, verifyToken, verifyStaff } from "../middleware/auth.js";
import {
    getAllStaff,
    getStaffById,
    createStaff,
    updateStaff,
    updateStaffPassword,
    adminResetPassword,
    updateOwnPassword,
    deleteStaff,
    getStaffStats,
    deactivateStaff
} from "../controllers/staffController.js";

const router = express.Router();

// Authenticated staff self-service: allows staff to update their own password
// without requiring admin intervention for routine credential rotations
router.put("/me/password", verifyToken, verifyStaff, updateOwnPassword);

router.use(verifyToken, verifyAdmin);

// Admin-only management: restricted to admins to prevent staff from
// creating accounts or modifying peer credentials
router.get("/", getAllStaff);
router.get("/stats", getStaffStats);
router.get("/:id", getStaffById);
router.post("/", createStaff);
router.put("/:id", updateStaff);
router.put("/:id/password", updateStaffPassword);
router.put("/:id/admin-reset-password", adminResetPassword);
router.put("/:id/deactivate", deactivateStaff);
router.delete("/:id", deleteStaff);

export default router;
