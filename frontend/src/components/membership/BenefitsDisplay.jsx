import { Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { MEMBERSHIP_TIERS } from '../../utils/membership';
import '../../styles/membership.css';

export default function BenefitsDisplay({ onSelectTier, currentTier = null, selectedTier = null }) {
    const tiers = Object.values(MEMBERSHIP_TIERS);

    return (
        <div className="membership-benefits-container">
            <div className="text-center mb-12">
                <h2 className="mb-4 text-2xl font-bold text-gray-900 sm:text-3xl">
                    Membership Tiers & Benefits
                </h2>
                <p className="text-lg text-gray-600">
                    Choose the membership tier that best fits your needs
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                {tiers.map((tier) => (
                    <Card
                        key={tier.tier}
                        className={`membership-tier-card transform transition-all duration-300 ${
                            selectedTier === tier.tier ? 'ring-2 ring-blue-600 scale-105' : ''
                        } ${currentTier === tier.tier ? 'border-green-500 border-2' : ''}`}
                    >
                        <CardHeader className="rounded-t-lg bg-gradient-to-r from-gray-50 to-gray-100 p-4 sm:p-5 lg:p-6">
                            <div className="mb-4 flex items-center justify-between gap-4">
                                <div>
                                    <div className="text-4xl mb-2">{tier.displayIcon}</div>
                                    <CardTitle className="text-2xl">{tier.tier}</CardTitle>
                                </div>
                                {currentTier === tier.tier && (
                                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                                        Current Tier
                                    </span>
                                )}
                            </div>
                            {tier.annual_fee > 0 && (
                                <CardDescription className="text-base font-semibold text-gray-700">
                                    ₱{tier.annual_fee.toLocaleString()} / year
                                </CardDescription>
                            )}
                            {tier.annual_fee === 0 && (
                                <CardDescription className="text-base font-semibold text-green-600">
                                    Free Membership
                                </CardDescription>
                            )}
                        </CardHeader>

                        <CardContent className="px-4 py-5 sm:px-5 lg:px-6 lg:py-6">
                            <div className="space-y-4 mb-6">
                                {/* Key Stats */}
                                <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {tier.monthlyDiscount}%
                                        </div>
                                        <div className="text-xs text-gray-600">Discount</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {tier.pointsMultiplier}x
                                        </div>
                                        <div className="text-xs text-gray-600">Points</div>
                                    </div>
                                </div>

                                {/* Benefits List */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900 text-sm">Benefits Include:</h4>
                                    {tier.benefits.map((benefit, idx) => (
                                        <div key={idx} className="flex items-start gap-3">
                                            <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                            <span className="text-sm text-gray-700 leading-tight">
                                                {benefit}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {currentTier !== tier.tier && (
                                <Button
                                    onClick={() => onSelectTier(tier.tier)}
                                    variant={selectedTier === tier.tier ? 'default' : 'outline'}
                                    className="w-full"
                                >
                                    {selectedTier === tier.tier ? 'Selected' : 'Choose ' + tier.tier}
                                </Button>
                            )}
                            {currentTier === tier.tier && (
                                <Button disabled className="w-full">
                                    Current Membership
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Comparison Table */}
            <div className="mt-16 bg-white rounded-lg overflow-hidden shadow">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-100 border-b-2 border-gray-300">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 w-1/3">
                                    Feature
                                </th>
                                {tiers.map((tier) => (
                                    <th
                                        key={tier.tier}
                                        className="px-6 py-4 text-center text-sm font-semibold text-gray-900"
                                    >
                                        {tier.displayIcon} {tier.tier}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            <tr>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                    Discount on Purchases
                                </td>
                                {tiers.map((tier) => (
                                    <td key={tier.tier} className="px-6 py-4 text-center text-sm text-gray-700">
                                        {tier.monthlyDiscount}%
                                    </td>
                                ))}
                            </tr>
                            <tr className="bg-gray-50">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                    Free Shipping Threshold
                                </td>
                                {tiers.map((tier) => (
                                    <td key={tier.tier} className="px-6 py-4 text-center text-sm text-gray-700">
                                        ₱{tier.freeShippingThreshold.toLocaleString()}
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                    Loyalty Points Multiplier
                                </td>
                                {tiers.map((tier) => (
                                    <td key={tier.tier} className="px-6 py-4 text-center text-sm text-gray-700">
                                        {tier.pointsMultiplier}x
                                    </td>
                                ))}
                            </tr>
                            <tr className="bg-gray-50">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                    Annual Fee
                                </td>
                                {tiers.map((tier) => (
                                    <td key={tier.tier} className="px-6 py-4 text-center text-sm text-gray-700">
                                        {tier.annual_fee === 0 ? (
                                            <span className="text-green-600 font-semibold">Free</span>
                                        ) : (
                                            `₱${tier.annual_fee.toLocaleString()}`
                                        )}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
