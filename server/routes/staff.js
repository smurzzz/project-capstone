import express from "express";
import { verifyAdmin, verifyToken, verifyStaff } from "../middleware/auth.js";
import {
    getAllStaff,
    getStaffById,
    createStaff,
    updateStaff,
    updateStaffPassword,
    updateOwnPassword,
    deleteStaff,
    getStaffStats,
    deactivateStaff
} from "../controllers/staffController.js";

const router = express.Router();

// Allow authenticated staff to update their own password
router.put("/me/password", verifyToken, verifyStaff, updateOwnPassword);

router.use(verifyToken, verifyAdmin);

// Admin routes
router.get("/", getAllStaff);
router.get("/stats", getStaffStats);
router.get("/:id", getStaffById);
router.post("/", createStaff);
router.put("/:id", updateStaff);
router.put("/:id/password", updateStaffPassword);
router.put("/:id/deactivate", deactivateStaff);
router.delete("/:id", deleteStaff);

export default router;
