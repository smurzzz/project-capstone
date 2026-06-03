import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import ApplicationStatusCard from '../../components/membership/ApplicationStatusCard';
import MemberBadge from '../../components/membership/MemberBadge';
import BenefitsDisplay from '../../components/membership/BenefitsDisplay';
import { membershipAPI, customersAPI } from '../../utils/api';
import { getTierDetails, getDaysUntilExpiration, isMembershipActive } from '../../utils/membership';

import { ArrowRight, Gift, Zap, TrendingUp, Calendar } from 'lucide-react';

export default function MembershipStatus() {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [membership, setMembership] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                navigate('/login');
            } else {
                fetchMembershipData();
            }
        }
    }, [user, authLoading, navigate]);

    const fetchMembershipData = async () => {
        try {
            setLoading(true);
            const [membershipRes, historyRes] = await Promise.all([
                membershipAPI.getMyMembership(),
                membershipAPI.getMyMembershipHistory()
            ]);

            setMembership(membershipRes.data.data?.membership || null);
            setHistory(historyRes.data.data?.history || []);
        } catch (error) {
            console.error('Error fetching membership data:', error);
            // Check if customer has membership info in their profile
            try {
                const customerRes = await customersAPI.getMe();
                if (customerRes.data.data?.customer?.membership) {
                    setMembership(customerRes.data.data.customer.membership);
                }
            } catch {
                setError('Failed to load membership information');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleApplyForMembership = () => {
        navigate('/membership/apply');
    };

    const handleRenew = () => {
        navigate('/membership/renew');
    };

    const handleReapply = () => {
        navigate('/membership/apply');
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                    <p className="mt-4 text-gray-600">Loading membership information...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const isMembershipStatusActive = isMembershipActive(membership);
    const tierDetails = getTierDetails(membership?.tier);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
            {/* Navigation Bar */}
            <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm mb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <h1 className="text-lg font-bold text-gray-900">
                            🏢 JBM Electro Ventures
                        </h1>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => navigate('/dashboard')}
                            >
                                Dashboard
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <h1 className="text-4xl font-bold text-gray-900">
                            Membership Dashboard
                        </h1>
                        {isMembershipStatusActive && (
                            <MemberBadge membership={membership} size="lg" />
                        )}
                    </div>
                    <p className="text-lg text-gray-600">
                        Welcome, {user.name}! Manage your membership and view your benefits
                    </p>
                </div>

                {error && (
                    <Card className="border-red-200 bg-red-50 mb-8">
                        <CardContent className="pt-6">
                            <p className="text-red-900">{error}</p>
                        </CardContent>
                    </Card>
                )}

                {/* No Membership */}
                {(!membership || membership.status === 'None') && (
                    <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 mb-8">
                        <CardHeader>
                            <CardTitle>Ready to Join?</CardTitle>
                            <CardDescription>
                                Become a member and unlock exclusive benefits, discounts, and rewards
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={handleApplyForMembership} size="lg" className="w-full sm:w-auto">
                                Apply for Membership
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Membership Status */}
                {membership && membership.status !== 'None' && (
                    <>
                        <div className="mb-8">
                            <ApplicationStatusCard
                                membership={membership}
                                onRenew={handleRenew}
                                onReapply={handleReapply}
                            />
                        </div>

                        {/* Membership Benefits Summary */}
                        {isMembershipStatusActive && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <Zap className="h-4 w-4 text-blue-600" />
                                            Discount Rate
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-blue-600">
                                            {tierDetails.monthlyDiscount}%
                                        </div>
                                        <p className="text-xs text-gray-600 mt-2">
                                            on all purchases
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <Gift className="h-4 w-4 text-amber-600" />
                                            Loyalty Points
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-amber-600">
                                            {membership.pointsBalance || 0}
                                        </div>
                                        <p className="text-xs text-gray-600 mt-2">
                                            {tierDetails.pointsMultiplier}x earning rate
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-green-600" />
                                            Free Shipping
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-green-600">
                                            ₱{tierDetails.freeShippingThreshold.toLocaleString()}
                                        </div>
                                        <p className="text-xs text-gray-600 mt-2">
                                            minimum order value
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-purple-600" />
                                            Expires In
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-purple-600">
                                            {getDaysUntilExpiration(membership.expiresAt)} days
                                        </div>
                                        <p className="text-xs text-gray-600 mt-2">
                                            {new Date(membership.expiresAt).toLocaleDateString()}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Current Tier Benefits */}
                        {isMembershipStatusActive && (
                            <Card className="mb-8">
                                <CardHeader>
                                    <CardTitle>Your {membership.tier} Member Benefits</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {tierDetails.benefits.map((benefit, idx) => (
                                            <div key={idx} className="flex items-start gap-3">
                                                <span className="text-xl mt-0.5">✓</span>
                                                <span className="text-gray-700">{benefit}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Membership History */}
                        {history.length > 0 && (
                            <Card className="mb-8">
                                <CardHeader>
                                    <CardTitle>Membership Activity</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {history.map((item, idx) => (
                                            <div key={idx} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-gray-900 capitalize">
                                                        {item.action.replace(/_/g, ' ')}
                                                    </p>
                                                    {item.newStatus && (
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            Status: {item.newStatus}
                                                        </p>
                                                    )}
                                                    {item.notes && (
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {item.notes}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-600">
                                                        {new Date(item.createdAt).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(item.createdAt).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Upgrade Benefits */}
                        {membership.tier !== 'Platinum' && isMembershipStatusActive && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Upgrade Your Membership</CardTitle>
                                    <CardDescription>
                                        Get more benefits and exclusive perks with a higher tier
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <BenefitsDisplay
                                        currentTier={membership.tier}
                                        onSelectTier={(tier) => {
                                            if (tier !== membership.tier) {
                                                navigate('/membership/upgrade');
                                            }
                                        }}
                                    />
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
