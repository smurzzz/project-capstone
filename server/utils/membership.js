export const MEMBERSHIP_TIERS = {
    Silver: {
        discountRate: 0.05,
        pointsPerPeso: 0.01,
    },
    Gold: {
        discountRate: 0.1,
        pointsPerPeso: 0.015,
    },
    Platinum: {
        discountRate: 0.15,
        pointsPerPeso: 0.02,
    },
};

export const MEMBERSHIP_STATUSES = ["Pending", "Active", "Expired", "Suspended", "Rejected"];

export const getTierBenefits = (tier = "Silver") =>
    MEMBERSHIP_TIERS[tier] || MEMBERSHIP_TIERS.Silver;

export const getActiveMembership = (customer) => {
    if (!customer || customer.role !== "Member") {
        return null;
    }

    const membership = customer.membership || {};
    if (membership.status !== "Active") {
        return null;
    }

    if (membership.expiresAt && new Date(membership.expiresAt) < new Date()) {
        return null;
    }

    return {
        tier: membership.tier || "Silver",
        ...getTierBenefits(membership.tier),
    };
};

export const calculateMembershipPoints = ({ customer, amount }) => {
    const activeMembership = getActiveMembership(customer);
    if (!activeMembership) {
        return 0;
    }

    return Math.floor(Number(amount || 0) * activeMembership.pointsPerPeso);
};
