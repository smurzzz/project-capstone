import express from "express";
import { verifyStaff, verifyToken } from "../middleware/auth.js";
import {
    createPromotion,
    deletePromotion,
    getPromotionStats,
    getPromotions,
    updatePromotion,
} from "../controllers/promotionController.js";

const router = express.Router();

router.get("/", verifyToken, verifyStaff, getPromotions);
router.get("/stats", verifyToken, verifyStaff, getPromotionStats);
router.post("/", verifyToken, verifyStaff, createPromotion);
router.put("/:id", verifyToken, verifyStaff, updatePromotion);
router.delete("/:id", verifyToken, verifyStaff, deletePromotion);

export default router;
