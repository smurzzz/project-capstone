import express from "express";
import { verifyStaff, verifyToken } from "../middleware/auth.js";
import { getReportOverview } from "../controllers/reportController.js";

const router = express.Router();

router.get("/overview", verifyToken, verifyStaff, getReportOverview);

export default router;
