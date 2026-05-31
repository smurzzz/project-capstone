import Promotion from "../models/Promotion.js";
import PromotionRedemption from "../models/PromotionRedemption.js";
import { getActiveMembership } from "./membership.js";

const roundMoney = (amount) => Math.round(Number(amount || 0) * 100) / 100;

const normalizeCode = (code) => String(code || "").trim().toUpperCase();

const isPromotionLive = (promotion, now = new Date()) =>
    promotion.isActive &&
    promotion.startsAt <= now &&
    (!promotion.endsAt || promotion.endsAt >= now) &&
    (!promotion.usageLimit || promotion.usedCount < promotion.usageLimit);

const getEligibleSubtotal = (promotion, lines) => {
    const productIds = new Set((promotion.eligibility?.productIds || []).map(String));
    const categories = new Set((promotion.eligibility?.categories || []).map((item) => String(item).toLowerCase()));

    if (productIds.size === 0 && categories.size === 0) {
        return roundMoney(lines.reduce((sum, line) => sum + line.lineSubtotal, 0));
    }

    return roundMoney(lines.reduce((sum, line) => {
        const productCategory = String(line.product?.category || "").toLowerCase();
        const matchesProduct = productIds.has(String(line.productId));
        const matchesCategory = categories.has(productCategory);

        return matchesProduct || matchesCategory ? sum + line.lineSubtotal : sum;
    }, 0));
};

const isCustomerEligible = (promotion, customer) => {
    const activeMembership = getActiveMembership(customer);
    const customerType = promotion.eligibility?.customerType || "all";

    if (customerType === "members" && !activeMembership) {
        return false;
    }

    if (customerType === "non_members" && activeMembership) {
        return false;
    }

    const tiers = promotion.eligibility?.tiers || [];
    if (tiers.length > 0 && !tiers.includes(activeMembership?.tier)) {
        return false;
    }

    return true;
};

const calculateDiscount = ({ promotion, eligibleSubtotal }) => {
    if (eligibleSubtotal <= 0) {
        return 0;
    }

    const rawDiscount = promotion.type === "percentage"
        ? eligibleSubtotal * (promotion.value / 100)
        : promotion.value;
    const cappedDiscount = promotion.maxDiscount > 0
        ? Math.min(rawDiscount, promotion.maxDiscount)
        : rawDiscount;

    return roundMoney(Math.min(cappedDiscount, eligibleSubtotal));
};

const getCustomerRedemptionCount = async ({ promotion, customer }) => {
    if (!customer?._id || !promotion.perCustomerLimit) {
        return 0;
    }

    return PromotionRedemption.countDocuments({
        promotionId: promotion._id,
        customerId: customer._id,
    });
};

const evaluatePromotion = async ({ promotion, customer, lines, orderSubtotal }) => {
    if (!isPromotionLive(promotion) || !isCustomerEligible(promotion, customer)) {
        return null;
    }

    if (promotion.minOrderAmount > 0 && orderSubtotal < promotion.minOrderAmount) {
        return null;
    }

    const customerRedemptions = await getCustomerRedemptionCount({ promotion, customer });
    if (promotion.perCustomerLimit && customerRedemptions >= promotion.perCustomerLimit) {
        return null;
    }

    const eligibleSubtotal = getEligibleSubtotal(promotion, lines);
    const discountAmount = calculateDiscount({ promotion, eligibleSubtotal });

    if (discountAmount <= 0) {
        return null;
    }

    return {
        promotion,
        discountAmount,
        eligibleSubtotal,
    };
};

export const calculatePromotions = async ({ promoCode, customer, lines, orderSubtotal }) => {
    const code = normalizeCode(promoCode);
    const query = {
        isActive: true,
        startsAt: { $lte: new Date() },
        $or: [{ endsAt: null }, { endsAt: { $gte: new Date() } }],
    };

    const promotions = code
        ? await Promotion.find({ ...query, code })
        : await Promotion.find({ ...query, isAutomatic: true });

    const evaluated = [];
    for (const promotion of promotions.sort((a, b) => a.priority - b.priority)) {
        const result = await evaluatePromotion({ promotion, customer, lines, orderSubtotal });
        if (result) {
            evaluated.push(result);
            if (promotion.isExclusive) {
                break;
            }
        }
    }

    if (code && evaluated.length === 0) {
        throw Object.assign(new Error("Promo code is invalid, expired, or not eligible for this order"), {
            statusCode: 400,
        });
    }

    const discountAmount = roundMoney(evaluated.reduce((sum, item) => sum + item.discountAmount, 0));

    return {
        discountAmount: Math.min(discountAmount, orderSubtotal),
        appliedPromotions: evaluated.map(({ promotion, discountAmount }) => ({
            promotionId: promotion._id,
            name: promotion.name,
            code: promotion.code || "",
            type: promotion.type,
            value: promotion.value,
            discountAmount,
        })),
    };
};

export const recordPromotionRedemptions = async ({ order, customerId, appliedPromotions, orderTotalBeforeDiscount }) => {
    if (!appliedPromotions?.length) {
        return;
    }

    await Promise.all(appliedPromotions.map(async (item) => {
        await Promise.all([
            Promotion.findByIdAndUpdate(item.promotionId, { $inc: { usedCount: 1 } }),
            PromotionRedemption.create({
                promotionId: item.promotionId,
                orderId: order._id,
                customerId,
                code: item.code,
                discountAmount: item.discountAmount,
                orderTotalBeforeDiscount,
            }),
        ]);
    }));
};
