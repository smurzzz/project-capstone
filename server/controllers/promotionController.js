import Promotion from "../models/Promotion.js";
import PromotionRedemption from "../models/PromotionRedemption.js";
import {
    cleanString,
    isValidObjectId,
    parseCurrency,
    parseStockQuantity,
} from "../utils/validation.js";

const validTypes = new Set(["percentage", "fixed_amount"]);
const validCustomerTypes = new Set(["all", "members", "non_members"]);
const validTiers = new Set(["Silver", "Gold", "Platinum"]);

const parseDate = (value, fallback = null) => {
    if (!value) {
        return fallback;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const mapPromotionInput = (body, user) => {
    const type = validTypes.has(body.type) ? body.type : "";
    const value = parseCurrency(body.value);
    const code = cleanString(body.code, 80).toUpperCase();
    const startsAt = parseDate(body.startsAt, new Date());
    const endsAt = parseDate(body.endsAt, null);
    const customerType = validCustomerTypes.has(body.eligibility?.customerType)
        ? body.eligibility.customerType
        : "all";

    return {
        name: cleanString(body.name, 160),
        description: cleanString(body.description, 1000),
        code: code || undefined,
        type,
        value,
        maxDiscount: parseCurrency(body.maxDiscount || 0),
        minOrderAmount: parseCurrency(body.minOrderAmount || 0),
        eligibility: {
            customerType,
            tiers: Array.isArray(body.eligibility?.tiers)
                ? body.eligibility.tiers.filter((tier) => validTiers.has(tier))
                : [],
            productIds: Array.isArray(body.eligibility?.productIds)
                ? body.eligibility.productIds.filter(isValidObjectId)
                : [],
            categories: Array.isArray(body.eligibility?.categories)
                ? body.eligibility.categories.map((item) => cleanString(item, 120)).filter(Boolean)
                : [],
        },
        usageLimit: parseStockQuantity(body.usageLimit || 0),
        perCustomerLimit: parseStockQuantity(body.perCustomerLimit ?? 1),
        priority: Number.isFinite(Number(body.priority)) ? Number(body.priority) : 100,
        isAutomatic: Boolean(body.isAutomatic),
        isExclusive: body.isExclusive === undefined ? true : Boolean(body.isExclusive),
        isActive: body.isActive === undefined ? true : Boolean(body.isActive),
        startsAt,
        endsAt,
        createdBy: user?.id || null,
    };
};

const validatePromotionPayload = (payload) => {
    if (!payload.name || !payload.type || payload.value === null || payload.value <= 0) {
        return "Promotion name, type, and positive discount value are required";
    }

    if (payload.type === "percentage" && payload.value > 100) {
        return "Percentage discount cannot exceed 100";
    }

    if (!payload.startsAt) {
        return "Invalid promotion start date";
    }

    if (payload.endsAt && payload.endsAt < payload.startsAt) {
        return "Promotion end date must be after start date";
    }

    return "";
};

export const getPromotions = async (req, res) => {
    try {
        const includeInactive = String(req.query.includeInactive || "") === "true";
        const query = includeInactive ? {} : { isActive: true };
        const promotions = await Promotion.find(query).sort({ priority: 1, createdAt: -1 });

        res.status(200).json({
            success: true,
            data: promotions,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const createPromotion = async (req, res) => {
    try {
        const payload = mapPromotionInput(req.body, req.user);
        const validationMessage = validatePromotionPayload(payload);

        if (validationMessage) {
            return res.status(400).json({
                success: false,
                message: validationMessage,
            });
        }

        const promotion = await Promotion.create(payload);

        res.status(201).json({
            success: true,
            message: "Promotion created successfully",
            data: promotion,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Promotion name or code already exists",
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const updatePromotion = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid promotion ID",
            });
        }

        const payload = mapPromotionInput(req.body, req.user);
        const validationMessage = validatePromotionPayload(payload);

        if (validationMessage) {
            return res.status(400).json({
                success: false,
                message: validationMessage,
            });
        }

        const promotion = await Promotion.findByIdAndUpdate(
            req.params.id,
            payload,
            { new: true, runValidators: true }
        );

        if (!promotion) {
            return res.status(404).json({
                success: false,
                message: "Promotion not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Promotion updated successfully",
            data: promotion,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Promotion name or code already exists",
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const deletePromotion = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid promotion ID",
            });
        }

        const promotion = await Promotion.findByIdAndDelete(req.params.id);
        if (!promotion) {
            return res.status(404).json({
                success: false,
                message: "Promotion not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Promotion deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const getPromotionStats = async (req, res) => {
    try {
        const [activePromotions, redemptions, revenueImpact] = await Promise.all([
            Promotion.countDocuments({ isActive: true }),
            PromotionRedemption.countDocuments(),
            PromotionRedemption.aggregate([
                {
                    $group: {
                        _id: null,
                        totalDiscounts: { $sum: "$discountAmount" },
                        affectedRevenue: { $sum: "$orderTotalBeforeDiscount" },
                    },
                },
            ]),
        ]);

        res.status(200).json({
            success: true,
            data: {
                activePromotions,
                redemptions,
                totalDiscounts: revenueImpact[0]?.totalDiscounts || 0,
                affectedRevenue: revenueImpact[0]?.affectedRevenue || 0,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
