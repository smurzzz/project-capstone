import Promotion from "../models/Promotion.js";
import PromotionRedemption from "../models/PromotionRedemption.js";
import {
    cleanString,
    isStaffRole,
    isValidObjectId,
    parseCurrency,
    parseStockQuantity,
} from "../utils/validation.js";

const validTypes = new Set(["percentage", "fixed_amount"]);
const validCustomerTypes = new Set(["all", "members", "non_members"]);
const validTiers = new Set(["Prime", "Stater", "Bronze"]);

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
    // Promotions feature disabled for Phase 1 deployment; returns empty set to prevent
    // frontend crashes while infrastructure is validated; can be re-enabled by modifying
    // route handlers when promotion business logic is ready for production
    return res.status(200).json({ success: true, data: [] });
};

export const createPromotion = async (req, res) => {
    // Promotions not enabled in this deployment phase; explicit rejection prevents
    // accidental API usage before backend/database constraints are fully audited
    return res.status(400).json({ success: false, message: "Promotions are not supported in this deployment" });
};

export const updatePromotion = async (req, res) => {
    // Promotions disabled intentionally; prevents partial state mutations that could
    // lead to data inconsistency during future re-enablement
    return res.status(400).json({ success: false, message: "Promotions are not supported in this deployment" });
};

export const deletePromotion = async (req, res) => {
    // Deleting promotions is not applicable
    return res.status(400).json({ success: false, message: "Promotions are not supported in this deployment" });
};

export const getPromotionStats = async (req, res) => {
    // Promotions disabled — return empty stats
    return res.status(200).json({
        success: true,
        data: {
            activePromotions: 0,
            redemptions: 0,
            totalDiscounts: 0,
            affectedRevenue: 0,
        },
    });
};
