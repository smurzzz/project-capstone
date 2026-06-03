import express from "express";
import {
    sendAdminNotification,
    sendOrderReceipt,
} from "../controllers/mailController.js";
import { verifyStaff, verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/admin-notification", verifyToken, verifyStaff, sendAdminNotification);
router.post("/orders/:orderId/receipt", verifyToken, verifyStaff, sendOrderReceipt);

export default router;
