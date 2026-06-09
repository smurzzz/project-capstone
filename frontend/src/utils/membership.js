/**
 * Membership Status Configuration
 */
export const MEMBERSHIP_STATUS = {
    PENDING: 'Pending',
    ACTIVE: 'Active',
    CANCELLED: 'Cancelled'
};

export const STATUS_COLORS = {
    Pending: '#F59E0B',
    Active: '#10B981',
    Cancelled: '#EF4444'
};

export const STATUS_ICONS = {
    Pending: '⏳',
    Active: '✓',
    Cancelled: '✗'
};

/**
 * Check if membership is active
 */
export const isMembershipActive = (membership) => {
    if (!membership) return false;
    return (
        membership.status === 'Active' ||
        membership.status === 'Approved'
    ) && membership.expiresAt && new Date(membership.expiresAt) > new Date();
};

/**
 * Check if membership is expired
 */
export const isMembershipExpired = (membership) => {
    if (!membership || !membership.expiresAt) return false;
    return new Date(membership.expiresAt) <= new Date();
};

/**
 * Get days until expiration
 */
export const getDaysUntilExpiration = (expiresAt) => {
    const now = new Date();
    const expiration = new Date(expiresAt);
    const diffTime = expiration - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

export default {
    MEMBERSHIP_STATUS,
    STATUS_COLORS,
    STATUS_ICONS,
    isMembershipActive,
    isMembershipExpired,
    getDaysUntilExpiration
};
