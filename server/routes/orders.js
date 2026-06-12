import express from "express";
import { optionalAuth, verifyStaff, verifyToken } from "../middleware/auth.js";
import {
    getAllOrders,
    getOrderById,
    getOrdersByCustomer,
    createOrder,
    updateOrderStatus,
    getOrderStats,
    cancelOrder
} from "../controllers/orderController.js";

const router = express.Router();

// Public/semi-public routes: optionalAuth allows both authenticated and unauthenticated orders;
// membership discounts and customer records are applied server-side when user is recognized
router.post("/", optionalAuth, createOrder);
router.get("/stats", verifyToken, verifyStaff, getOrderStats);
router.get("/customer/:customerId", verifyToken, getOrdersByCustomer);
router.get("/:id", verifyToken, getOrderById);

// Admin-only routes: staff can view all orders, change status, and process cancellations
router.get("/", verifyToken, verifyStaff, getAllOrders);
router.put("/:id/status", verifyToken, verifyStaff, updateOrderStatus);
router.put("/:id/cancel", verifyToken, verifyStaff, cancelOrder);

export default router;
