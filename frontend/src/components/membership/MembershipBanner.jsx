import { useEffect, useState } from 'react';
import { Gift, Zap, Calendar, Crown, AlertCircle } from 'lucide-react';
import { customersAPI } from '../../utils/api';
import {
    getTierDetails,
    getDaysUntilExpiration,
    isMembershipActive,
    ACTIVE_MEMBERSHIP_SRP_DISCOUNT_PERCENT,
} from '../../utils/membership';
import './membership-banner.css';

const BENEFITS = {
    Silver: [
        'Birthday Discount',
        'Early Access to Sales',
        'Priority Support'
    ],
    Gold: [
        'All Silver Benefits',
        '40% Discount on All Products',
        'Exclusive Products',
        'Free Shipping',
        'VIP Support'
    ],
    Platinum: [
        'All Gold Benefits',
        '40% Discount on All Products',
        'Concierge Service',
        'Monthly Gift Box',
        'Priority Customer Support',
        'Exclusive Events Access'
    ]
};

export default function MembershipBanner() {
    const [membership, setMembership] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMembershipData = async () => {
            try {
                const response = await customersAPI.getMe();
                const customerData = response.data.data;
                setMembership(customerData.customer?.membership);
            } catch (err) {
                if (err.response?.status !== 401) {
                    console.error('Failed to load membership information:', err);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchMembershipData();

        // Refresh membership data every 30 seconds
        const interval = setInterval(fetchMembershipData, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="membership-banner loading">
                <div className="banner-spinner"></div>
            </div>
        );
    }

    if (!membership || membership.status === 'None') {
        return null;
    }

    if (!isMembershipActive(membership)) {
        return null;
    }

    const tierDetails = getTierDetails(membership.tier);
    const daysRemaining = getDaysUntilExpiration(membership.expiresAt);
    const isExpiringSoon = daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 30;

    const benefits = BENEFITS[membership.tier] || BENEFITS.Silver;

    return (
        <div 
            className="membership-banner"
            style={{ borderTopColor: tierDetails.displayColor }}
        >
            {/* Alert for expiring soon */}
            {isExpiringSoon && (
                <div className="expiration-alert">
                    <AlertCircle size={16} />
                    <span>Your membership expires in {daysRemaining} days</span>
                </div>
            )}

            <div className="banner-content">
                {/* Header with Tier */}
                <div className="banner-header">
                    <div className="tier-badge" style={{ backgroundColor: tierDetails.displayColor }}>
                        <Crown size={20} />
                        <span>{membership.tier}</span>
                    </div>
                    <div className="membership-status">
                        <p className="status-label">Membership Status</p>
                        <p className="status-value">{membership.status}</p>
                    </div>
                </div>

                {/* Main Info Grid */}
                <div className="banner-grid">
                    {/* Benefits Section */}
                    <div className="info-section">
                        <div className="section-header">
                            <Gift size={20} />
                            <h3>Your Benefits</h3>
                        </div>
                        <ul className="benefits-list">
                            {benefits.slice(0, 3).map((benefit, index) => (
                                <li key={index}>
                                    <span className="benefit-icon">✓</span>
                                    {benefit}
                                </li>
                            ))}
                            {benefits.length > 3 && (
                                <li className="more-benefits">
                                    +{benefits.length - 3} more benefits
                                </li>
                            )}
                        </ul>
                    </div>

                    <div className="info-section">
                        <div className="section-header">
                            <Zap size={20} />
                            <h3>Rewards</h3>
                        </div>
                        <div className="discount-item">
                            <Zap size={16} />
                            <div>
                                <p className="item-label">Discount</p>
                                <p className="item-value">{ACTIVE_MEMBERSHIP_SRP_DISCOUNT_PERCENT}%</p>
                            </div>
                        </div>
                    </div>

                    {/* Expiration Info */}
                    <div className="info-section">
                        <div className="section-header">
                            <Calendar size={20} />
                            <h3>Membership Period</h3>
                        </div>
                        <div className="dates-display">
                            <div className="date-item">
                                <p className="date-label">Joined</p>
                                <p className="date-value">
                                    {new Date(membership.joinedAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                            <div className="date-item">
                                <p className="date-label">Expires</p>
                                <p className="date-value">
                                    {membership.expiresAt ? new Date(membership.expiresAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    }) : 'No expiration date'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="membership-progress">
                    <div className="progress-info">
                        <span className="progress-label">Membership Validity</span>
                        <span className="progress-value">
                            {daysRemaining !== null ? `${daysRemaining} days remaining` : 'No expiration set'}
                        </span>
                    </div>
                    <div className="progress-bar">
                        <div 
                            className="progress-fill"
                            style={{
                                width: `${daysRemaining !== null ? Math.max(0, Math.min(100, (daysRemaining / 365) * 100)) : 100}%`,
                                backgroundColor: tierDetails.displayColor
                            }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
