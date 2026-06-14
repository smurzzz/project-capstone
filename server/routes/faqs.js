import express from "express";
import { verifyToken, verifyStaff } from "../middleware/auth.js";
import Staff from "../models/Staff.js";
import User from "../models/User.js";
import { isStaffRole } from "../utils/validation.js";
import {
  getAllFAQs,
  getFAQById,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  getFAQsByCategory,
} from "../controllers/faqController.js";

const router = express.Router();

// Public read-only routes: FAQs visible to all users without authentication;
// improves UX by letting visitors learn about services before account creation
router.get("/", getAllFAQs);
router.get("/category/:category", getFAQsByCategory);
router.get("/:id", getFAQById);

// Staff management: staff can create, update, and delete FAQs to maintain
// current help content as product features and policies evolve
const ensureStaffOrAdmin = async (req, res, next) => {
  // If token payload already indicates staff/admin and role is valid, allow
  if (req.user && req.user.type === 'staff' && isStaffRole(req.user.role)) return next();

  // Fallback: try to resolve staff/admin account from DB using token id
  try {
    const id = req.user?.id;
    if (!id) return res.status(403).json({ success: false, message: 'Access denied. Staff privileges required' });

    const staff = await Staff.findById(id);
    if (staff && staff.isActive) return next();

    const adminUser = await User.findOne({ _id: id, role: 'admin' });
    if (adminUser) return next();
  } catch (err) {
    console.warn('[FAQ.ensureStaffOrAdmin] lookup failed', err.message);
  }

  return res.status(403).json({ success: false, message: 'Access denied. Staff privileges required' });
};

router.post("/", verifyToken, ensureStaffOrAdmin, createFAQ);
router.put("/:id", verifyToken, ensureStaffOrAdmin, updateFAQ);
router.delete("/:id", verifyToken, ensureStaffOrAdmin, deleteFAQ);

export default router;
