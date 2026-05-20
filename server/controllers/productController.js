import Product from "../models/Product.js";
import {
    cleanString,
    cleanProfileImage,
    isValidObjectId,
    parseCurrency,
    parseStockQuantity,
} from "../utils/validation.js";

const mapProductInput = (body) => {
    const srp = parseCurrency(body.srp ?? body.price);
    const stockLevel = parseStockQuantity(body.stockLevel);
    const minStock = parseStockQuantity(body.minStock ?? 0);

    return {
        productName: cleanString(body.productName, 160),
        sku: cleanString(body.sku, 80) || undefined,
        stockLevel,
        minStock,
        srp,
        price: srp,
        description: cleanString(body.description, 1000),
        imageUrl: cleanProfileImage(body.imageUrl),
        category: cleanString(body.category, 120),
        supplier: cleanString(body.supplier, 160),
    };
};

const getValidationMessage = (error) => {
    if (error.name !== "ValidationError") {
        return null;
    }

    return Object.values(error.errors || {})[0]?.message || "Invalid product data";
};

/**
 * Get all products
 */
export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({ productName: 1 });
        res.status(200).json({
            success: true,
            data: products,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Get product by ID
 */
export const getProductById = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID",
            });
        }

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        res.status(200).json({
            success: true,
            data: product,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Create new product (Admin only)
 */
export const createProduct = async (req, res) => {
    try {
        const payload = mapProductInput(req.body);

        if (!payload.productName || payload.stockLevel === null || payload.srp === null) {
            return res.status(400).json({
                success: false,
                message: "Product name, SRP, and stock level are required",
            });
        }

        const newProduct = await Product.create(payload);
        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: newProduct,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Product name or SKU already exists",
            });
        }

        const validationMessage = getValidationMessage(error);
        if (validationMessage) {
            return res.status(400).json({
                success: false,
                message: validationMessage,
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Update product (Admin only)
 */
export const updateProduct = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID",
            });
        }

        const payload = mapProductInput(req.body);

        if (!payload.productName || payload.stockLevel === null || payload.srp === null) {
            return res.status(400).json({
                success: false,
                message: "Product name, SRP, and stock level are required",
            });
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            {
                ...payload,
                updatedAt: new Date(),
            },
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: product,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Product name or SKU already exists",
            });
        }

        const validationMessage = getValidationMessage(error);
        if (validationMessage) {
            return res.status(400).json({
                success: false,
                message: validationMessage,
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Delete product (Admin only)
 */
export const deleteProduct = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID",
            });
        }

        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Product deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Update stock level
 */
export const updateStock = async (req, res) => {
    try {
        const { productId } = req.body;
        const quantity = parseStockQuantity(req.body.quantity);

        if (!isValidObjectId(productId) || quantity === null) {
            return res.status(400).json({
                success: false,
                message: "Valid product ID and quantity are required",
            });
        }

        const product = await Product.findByIdAndUpdate(
            productId,
            {
                stockLevel: quantity,
                updatedAt: new Date(),
            },
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Stock updated successfully",
            data: product,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Get low stock products (Admin dashboard)
 */
export const getLowStockProducts = async (req, res) => {
    try {
        const threshold = parseStockQuantity(req.query.threshold) ?? 10;
        const products = await Product.find({ stockLevel: { $lt: threshold } })
            .sort({ stockLevel: 1 });

        res.status(200).json({
            success: true,
            data: products,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
