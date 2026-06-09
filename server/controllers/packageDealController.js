import PackageDeal from "../models/PackageDeal.js";
import Product from "../models/Product.js";
import {
    cleanProfileImage,
    cleanString,
    isStaffRole,
    isValidObjectId,
    parseCurrency,
    parseOrderQuantity,
} from "../utils/validation.js";

const mapItems = async (items = []) => {
    const safeItems = Array.isArray(items) ? items.slice(0, 50) : [];
    const mappedItems = [];

    for (const item of safeItems) {
        const productId = cleanString(item.productId, 80);
        const quantity = parseOrderQuantity(item.quantity ?? 1);
        let name = cleanString(item.name, 160);
        let validProductId = null;

        if (productId && isValidObjectId(productId)) {
            const product = await Product.findById(productId).select("productName");
            if (product) {
                validProductId = product._id;
                name = name || product.productName;
            }
        }

        if (!name || quantity === null) {
            continue;
        }

        mappedItems.push({
            productId: validProductId,
            name,
            quantity,
        });
    }

    return mappedItems;
};

const mapPackageInput = async (body) => {
    const price = parseCurrency(body.price);
    const originalPriceInput = body.originalPrice === "" || body.originalPrice === undefined
        ? body.price
        : body.originalPrice;
    const originalPrice = parseCurrency(originalPriceInput);

    return {
        name: cleanString(body.name, 160),
        description: cleanString(body.description, 1000),
        price,
        originalPrice,
        imageUrl: cleanProfileImage(body.imageUrl),
        items: await mapItems(body.items),
        isPopular: Boolean(body.isPopular),
        isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    };
};

export const getAllPackageDeals = async (req, res) => {
    try {
        const includeInactive = String(req.query.includeInactive || "") === "true" && isStaffRole(req.user?.role);
        const query = includeInactive ? {} : { isActive: true };
        const packages = await PackageDeal.find(query)
            .populate("items.productId", "productName imageUrl srp price stockLevel")
            .sort({ isPopular: -1, createdAt: -1 });

        res.status(200).json({
            success: true,
            data: packages,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const getPackagesForMembershipApplication = async (req, res) => {
    try {
        const packages = await PackageDeal.find({ isActive: true })
            .populate("items.productId", "productName imageUrl srp price stockLevel")
            .sort({ price: 1 });

        // Filter out packages with "B" in their name (case-insensitive)
        const filteredPackages = packages.filter(pkg => !pkg.name.toLowerCase().includes("b"));

        res.status(200).json({
            success: true,
            data: filteredPackages,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const getPackageDealById = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid package ID",
            });
        }

        const packageDeal = await PackageDeal.findById(req.params.id)
            .populate("items.productId", "productName imageUrl srp price stockLevel");

        if (!packageDeal) {
            return res.status(404).json({
                success: false,
                message: "Package deal not found",
            });
        }

        res.status(200).json({
            success: true,
            data: packageDeal,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const createPackageDeal = async (req, res) => {
    try {
        const payload = await mapPackageInput(req.body);

        if (!payload.name || !payload.description || payload.price === null) {
            return res.status(400).json({
                success: false,
                message: "Package name, description, and price are required",
            });
        }

        const packageDeal = await PackageDeal.create(payload);

        res.status(201).json({
            success: true,
            message: "Package deal created successfully",
            data: packageDeal,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Package name already exists",
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const updatePackageDeal = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid package ID",
            });
        }

        const payload = await mapPackageInput(req.body);

        if (!payload.name || !payload.description || payload.price === null) {
            return res.status(400).json({
                success: false,
                message: "Package name, description, and price are required",
            });
        }

        const packageDeal = await PackageDeal.findByIdAndUpdate(
            req.params.id,
            payload,
            { new: true, runValidators: true }
        );

        if (!packageDeal) {
            return res.status(404).json({
                success: false,
                message: "Package deal not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Package deal updated successfully",
            data: packageDeal,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Package name already exists",
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const deletePackageDeal = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid package ID",
            });
        }

        const packageDeal = await PackageDeal.findByIdAndDelete(req.params.id);

        if (!packageDeal) {
            return res.status(404).json({
                success: false,
                message: "Package deal not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Package deal deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
