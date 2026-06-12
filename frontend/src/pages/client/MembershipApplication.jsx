import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import BackToHomeButton from '../../components/BackToHomeButton';
import { toast } from 'sonner';
import logoSrc from '../../assets/logo.webp';
import { membershipAPI, packagesAPI } from '../../utils/api';

const MEMBERSHIP_PACKAGES = [
    {
        name: 'Prime Package',
        description: 'Basic starter package with essential product value',
        price: 250,
        borderColor: '#22C55E' // Green
    },
    {
        name: 'Starter Package',
        description: 'Entry-level package with added savings',
        price: 999,
        borderColor: '#3B82F6' // Blue
    },
    {
        name: 'Bronze Easy Plan',
        description: 'Installment option for the Bronze Package',
        price: 1888,
        borderColor: '#06B6D4' // Cyan
    },
    {
        name: 'Bronze Package',
        description: 'Mid-range package with increased product value',
        price: 4498,
        borderColor: '#FB923C' // Orange
    }
];

export default function MembershipApplication() {
    const navigate = useNavigate();
    const [selectedTier, setSelectedTier] = useState(null);
    const [existingMembership, setExistingMembership] = useState(null);
    const [packageDeals, setPackageDeals] = useState([]);

    useEffect(() => {
        const fetchMembershipData = async () => {
            try {
                const [membershipResponse, packagesResponse] = await Promise.all([
                    membershipAPI.getMyMembership().catch(() => ({ data: { data: { membership: null } } })),
                    packagesAPI.getAll().catch(() => ({ data: { data: [] } })),
                ]);

                setExistingMembership(membershipResponse.data.data?.membership || null);
                setPackageDeals(packagesResponse.data.data || []);
            } catch (err) {
                void err;
            }
        };

        fetchMembershipData();
    }, []);

    const handleSelectTier = (tier) => {
        setSelectedTier(tier);
    };

    const handlePurchase = () => {
        if (existingMembership?.status && existingMembership.status !== 'None' && existingMembership.status !== 'Rejected') {
            navigate('/membership/status');
            return;
        }

        if (!selectedTier) {
            toast.error('Please select a membership package');
            return;
        }

        const selectedPackageDeal = packageDeals.find((pkg) => pkg.name === selectedTier);
        if (!selectedPackageDeal) {
            toast.error('This package deal is not available right now');
            return;
        }

        navigate('/membership/apply');
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            {/* Navigation Bar */}
            <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm mb-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <img
                                src={logoSrc}
                                alt="JBM Electro Ventures logo"
                                className="h-10 w-10 rounded-xl bg-white p-1 object-contain"
                            />
                            <h1 className="text-lg font-bold text-gray-900">
                                JBM Electro Ventures
                            </h1>
                        </div>
                        <div className="flex gap-3">
                            <BackToHomeButton />
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        JBM Electro Ventures
                    </h1>
                    <p className="text-lg text-gray-600">
                        Select your Package
                    </p>
                </div>

                {/* Package List */}
                <div className="space-y-3 mb-8">
                    {MEMBERSHIP_PACKAGES.map((pkg, idx) => (
                        <div
                            key={idx}
                            onClick={() => handleSelectTier(pkg.name)}
                            className={`flex items-center gap-4 p-4 bg-white border-l-4 rounded-lg cursor-pointer transition-all ${
                                selectedTier === pkg.name
                                    ? 'shadow-md'
                                    : 'hover:shadow-sm'
                            }`}
                            style={{
                                borderLeftColor: pkg.borderColor
                            }}
                        >
                            {/* Radio Button */}
                            <div className="flex-shrink-0">
                                <div
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                        selectedTier === pkg.name
                                            ? 'border-blue-600 bg-blue-600'
                                            : 'border-gray-300 bg-white'
                                    }`}
                                >
                                    {selectedTier === pkg.name && (
                                        <div className="w-2 h-2 bg-white rounded-full" />
                                    )}
                                </div>
                            </div>

                            {/* Package Details */}
                            <div className="flex-grow">
                                <h3 className="font-bold text-gray-900">{pkg.name}</h3>
                                <p className="text-sm text-gray-600">{pkg.description}</p>
                            </div>

                            {/* Price */}
                            <div className="text-right flex-shrink-0">
                                <p className="text-lg font-bold text-gray-900">
                                    ₱{pkg.price.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Purchase Button */}
                <Button
                    onClick={handlePurchase}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-lg font-semibold"
                    size="lg"
                >
                    {existingMembership?.status && existingMembership.status !== 'None' && existingMembership.status !== 'Rejected'
                        ? 'View Status'
                        : 'Purchase'}
                </Button>
            </div>
        </div>
    );
}
