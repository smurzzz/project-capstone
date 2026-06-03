import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import BenefitsDisplay from '../../components/membership/BenefitsDisplay';
import ApplicationForm from '../../components/membership/ApplicationForm';
import { membershipAPI } from '../../utils/api';
import { toast } from 'sonner';

export default function MembershipApplication() {
    const navigate = useNavigate();
    const [step, setStep] = useState('benefits'); // benefits or form
    const [selectedTier, setSelectedTier] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSelectTier = (tier) => {
        setSelectedTier(tier);
        setTimeout(() => setStep('form'), 300);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmitApplication = async (formData) => {
        if (!selectedTier) {
            toast.error('Please select a membership tier');
            return;
        }

        try {
            setIsLoading(true);
            const applicationData = {
                ...formData,
                membershipType: selectedTier
            };

            await membershipAPI.applyForMembership(applicationData);
            
            toast.success('Application submitted successfully!', {
                description: 'You will receive an email notification when your application is reviewed.'
            });

            // Redirect to membership status page after 2 seconds
            setTimeout(() => {
                navigate('/membership/status');
            }, 2000);
        } catch (error) {
            console.error('Error submitting application:', error);
            toast.error(error.response?.data?.message || 'Failed to submit application. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToBenefits = () => {
        setSelectedTier(null);
        setStep('benefits');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
            {/* Navigation Bar */}
            <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm mb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <h1 className="text-lg font-bold text-gray-900">
                                🏢 JBM Electro Ventures
                            </h1>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => navigate('/')}
                            >
                                Back Home
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                        Become a Member
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Join our exclusive membership program and unlock special benefits, discounts, and rewards
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="mb-12">
                    <div className="flex items-center justify-center gap-2 sm:gap-4">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                            step === 'benefits' ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-600'
                        }`}>
                            <span className="font-semibold">1</span>
                            <span className="hidden sm:inline">View Benefits</span>
                        </div>
                        <div className="hidden sm:block w-8 h-0.5 bg-gray-300" />
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                            step === 'form' ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-600'
                        }`}>
                            <span className="font-semibold">2</span>
                            <span className="hidden sm:inline">Complete Application</span>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                {step === 'benefits' ? (
                    <div className="space-y-8">
                        <BenefitsDisplay
                            onSelectTier={handleSelectTier}
                            selectedTier={selectedTier}
                        />

                        {/* FAQ Section */}
                        <Card className="mt-12">
                            <CardHeader>
                                <CardTitle>Frequently Asked Questions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <details className="group cursor-pointer">
                                    <summary className="flex items-center justify-between py-4 px-4 hover:bg-gray-50 rounded-lg">
                                        <span className="font-semibold text-gray-900">
                                            How much does membership cost?
                                        </span>
                                        <ChevronDown className="h-5 w-5 group-open:hidden" />
                                        <ChevronUp className="h-5 w-5 hidden group-open:block" />
                                    </summary>
                                    <div className="px-4 pb-4 text-gray-700">
                                        Silver membership is completely free. Gold and Platinum memberships have annual fees that give you access to more exclusive benefits and higher discounts.
                                    </div>
                                </details>

                                <details className="group cursor-pointer">
                                    <summary className="flex items-center justify-between py-4 px-4 hover:bg-gray-50 rounded-lg">
                                        <span className="font-semibold text-gray-900">
                                            When will my application be reviewed?
                                        </span>
                                        <ChevronDown className="h-5 w-5 group-open:hidden" />
                                        <ChevronUp className="h-5 w-5 hidden group-open:block" />
                                    </summary>
                                    <div className="px-4 pb-4 text-gray-700">
                                        Your application will be reviewed within 24-48 hours. You'll receive an email notification about your application status.
                                    </div>
                                </details>

                                <details className="group cursor-pointer">
                                    <summary className="flex items-center justify-between py-4 px-4 hover:bg-gray-50 rounded-lg">
                                        <span className="font-semibold text-gray-900">
                                            What ID documents are accepted?
                                        </span>
                                        <ChevronDown className="h-5 w-5 group-open:hidden" />
                                        <ChevronUp className="h-5 w-5 hidden group-open:block" />
                                    </summary>
                                    <div className="px-4 pb-4 text-gray-700">
                                        We accept government-issued IDs including Passport, Driver's License, Voter ID, SSS ID, or TIN. Please ensure the document is clear and valid.
                                    </div>
                                </details>

                                <details className="group cursor-pointer">
                                    <summary className="flex items-center justify-between py-4 px-4 hover:bg-gray-50 rounded-lg">
                                        <span className="font-semibold text-gray-900">
                                            Can I change my membership tier later?
                                        </span>
                                        <ChevronDown className="h-5 w-5 group-open:hidden" />
                                        <ChevronUp className="h-5 w-5 hidden group-open:block" />
                                    </summary>
                                    <div className="px-4 pb-4 text-gray-700">
                                        Yes! You can upgrade or downgrade your membership tier at any time. Contact our support team or log in to your account to make changes.
                                    </div>
                                </details>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Back Button */}
                        <Button
                            variant="ghost"
                            onClick={handleBackToBenefits}
                            className="mb-6"
                        >
                            ← Back to Benefits
                        </Button>

                        {/* Form */}
                        <ApplicationForm
                            selectedTier={selectedTier}
                            onSubmit={handleSubmitApplication}
                            isLoading={isLoading}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
