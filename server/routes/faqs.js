import express from "express";
import { verifyToken, verifyAdmin } from "../middleware/auth.js";
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

// Admin management: staff can create, update, and delete FAQs to maintain
// current help content as product features and policies evolve
router.post("/", verifyToken, verifyAdmin, createFAQ);
router.put("/:id", verifyToken, verifyAdmin, updateFAQ);
router.delete("/:id", verifyToken, verifyAdmin, deleteFAQ);

export default router;
