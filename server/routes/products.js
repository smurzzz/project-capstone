import express from "express";
import { verifyAdmin, verifyStaff, verifyToken } from "../middleware/auth.js";
import {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    getLowStockProducts,
    getInventoryMovements
} from "../controllers/productController.js";

const router = express.Router();

// Public-facing routes: customers browse products without authentication;
// prevents creating account barriers to product discovery and shopping
router.get("/", getAllProducts);
router.get("/low-stock", verifyToken, verifyStaff, getLowStockProducts);
router.get("/:id/movements", verifyToken, verifyStaff, getInventoryMovements);
router.get("/:id", getProductById);

// Admin management routes: restricted to staff for inventory and pricing control
router.post("/", verifyToken, verifyStaff, createProduct);
router.put("/:id", verifyToken, verifyStaff, updateProduct);
router.delete("/:id", verifyToken, verifyStaff, deleteProduct);
router.post("/update-stock", verifyToken, verifyStaff, updateStock);

export default router;
