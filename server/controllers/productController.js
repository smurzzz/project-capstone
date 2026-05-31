import Product from "../models/Product.js";
import InventoryMovement from "../models/InventoryMovement.js";
import {
    cleanString,
    cleanProfileImage,
    isValidObjectId,
    parseCurrency,
    parseStockQuantity,
} from "../utils/validation.js";
import { bumpCacheVersion, getCacheVersion, getJsonCache, setJsonCache } from "../utils/cache.js";

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

const escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseListQuery = (query) => {
    const page = Math.max(Number.parseInt(query.page || "1", 10) || 1, 1);
    const requestedLimit = Number.parseInt(query.limit || "0", 10) || 0;
    const limit = requestedLimit > 0 ? Math.min(requestedLimit, 100) : 0;
    const search = cleanString(query.search, 120);
    const category = cleanString(query.category, 120);
    const queryFilter = {};

    if (category && category !== "all") {
        queryFilter.category = category;
    }

    if (search) {
        const pattern = new RegExp(escapeRegex(search), "i");
        queryFilter.$or = [
            { productName: pattern },
            { sku: pattern },
            { category: pattern },
            { supplier: pattern },
            { description: pattern },
        ];
    }

    return { page, limit, queryFilter };
};

/**
 * Get all products
 */
export const getAllProducts = async (req, res) => {
    try {
        const { page, limit, queryFilter } = parseListQuery(req.query);
        const query = Product.find(queryFilter).sort({ productName: 1 }).lean();

        if (limit > 0) {
            query.skip((page - 1) * limit).limit(limit);
        }

        const [products, total] = await Promise.all([
            query,
            limit > 0 ? Product.countDocuments(queryFilter) : Promise.resolve(undefined),
        ]);

        res.setHeader("Cache-Control", "private, max-age=30");
        res.status(200).json({
            success: true,
            data: products,
            meta: limit > 0 ? {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            } : undefined,
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

        const product = await Product.findById(req.params.id).lean();
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
        const reason = cleanString(req.body.reason, 500);

        if (!isValidObjectId(productId) || quantity === null) {
            return res.status(400).json({
                success: false,
                message: "Valid product ID and quantity are required",
            });
        }

        const currentProduct = await Product.findById(productId);

        if (!currentProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        const stockBefore = currentProduct.stockLevel;
        currentProduct.stockLevel = quantity;
        currentProduct.updatedAt = new Date();
        const product = await currentProduct.save();

        if (stockBefore !== product.stockLevel) {
            await InventoryMovement.create({
                productId: product._id,
                productName: product.productName,
                type: "manual_adjustment",
                quantityChange: product.stockLevel - stockBefore,
                stockBefore,
                stockAfter: product.stockLevel,
                actorType: req.user?.type || "staff",
                actorId: req.user?.id || null,
                reason: reason || "Manual stock update",
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
 * Get inventory movement history for a product
 */
export const getInventoryMovements = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID",
            });
        }

        const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
        const movements = await InventoryMovement.find({ productId: req.params.id })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        res.status(200).json({
            success: true,
            data: movements,
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
            .sort({ stockLevel: 1 })
            .lean();

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
