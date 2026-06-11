import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { getDaysUntilExpiration, isMembershipExpired } from '../../utils/membership';

const STATUS_ICONS = {
    Pending: Clock,
    Approved: CheckCircle,
    Active: CheckCircle,
    Rejected: XCircle,
    Expired: AlertCircle
};

export default function ApplicationStatusCard({ membership, onRenew, onReapply }) {
    if (!membership) {
        return (
            <Card className="border-gray-200">
                <CardContent className="px-4 py-5 sm:px-6 sm:py-6">
                    <p className="text-center text-gray-600">
                        No membership information available
                    </p>
                </CardContent>
            </Card>
        );
    }

    const isExpired = isMembershipExpired(membership);
    const StatusIcon = STATUS_ICONS[isExpired ? 'Expired' : membership.status] || AlertCircle;
    const daysRemaining = getDaysUntilExpiration(membership.expiresAt);

    const getStatusColor = () => {
        if (isExpired) return 'bg-gray-50 border-gray-200';
        switch (membership.status) {
            case 'Approved':
            case 'Active':
                return 'bg-green-50 border-green-200';
            case 'Pending':
                return 'bg-yellow-50 border-yellow-200';
            case 'Rejected':
                return 'bg-red-50 border-red-200';
            case 'Expired':
                return 'bg-gray-50 border-gray-200';
            default:
                return 'bg-gray-50 border-gray-200';
        }
    };

    const getTextColor = () => {
        if (isExpired) return 'text-gray-900';
        switch (membership.status) {
            case 'Approved':
            case 'Active':
                return 'text-green-900';
            case 'Pending':
                return 'text-yellow-900';
            case 'Rejected':
                return 'text-red-900';
            case 'Expired':
                return 'text-gray-900';
            default:
                return 'text-gray-900';
        }
    };

    return (
        <Card className={`${getStatusColor()} border-2`}>
            <CardHeader className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <StatusIcon className={`h-6 w-6 ${getTextColor()}`} />
                            <CardTitle className={getTextColor()}>
                                {isExpired ? 'Expired' : membership.status}
                            </CardTitle>
                            {!isExpired && membership.status === 'Active' && (
                                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-900 text-white">
                                    {membership.tier || 'Member'}
                                </span>
                            )}
                        </div>
                        <CardDescription className={getTextColor()}>
                            {isExpired && (
                                'Your membership has expired. Apply again to regain benefits.'
                            )}
                            {!isExpired && membership.status === 'Pending' && (
                                'Your application is under review. Activation will be set once your order is completed.'
                            )}
                            {!isExpired && membership.status === 'Active' && (
                                `Your membership is active and benefits are available`
                            )}
                            {!isExpired && membership.status === 'Approved' && (
                                'Your membership has been approved. Activation will be set once your order is completed.'
                            )}
                            {!isExpired && membership.status === 'Rejected' && (
                                'Your application was not approved. You can submit a new application.'
                            )}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Membership Details */}
                {!isExpired && (membership.status === 'Active' || membership.status === 'Approved') && (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 p-4 rounded-lg bg-white/60">
                        <div>
                            <p className="text-xs text-gray-600 font-medium">Tier</p>
                            <p className="text-lg font-bold text-gray-900">{membership.tier}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-600 font-medium">Activated</p>
                            <p className="text-sm font-medium text-gray-900">
                                {new Date(membership.joinedAt).toLocaleDateString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-600 font-medium">Expires</p>
                            <p className="text-sm font-medium text-gray-900">
                                {new Date(membership.expiresAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                )}

                {/* Expiration Warning */}
                {membership.status === 'Active' && daysRemaining <= 30 && daysRemaining > 0 && (
                    <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                        <p className="text-sm font-semibold text-yellow-900">
                            ⏰ Your membership expires in {daysRemaining} days
                        </p>
                        <p className="text-xs text-yellow-800 mt-1">
                            Consider applying again if you want to retain benefits
                        </p>
                    </div>
                )}

                {/* Expired Status */}
                {isExpired && (
                    <div className="p-4 rounded-lg bg-gray-100 border border-gray-300">
                        <p className="text-sm font-semibold text-gray-900">
                            Expired on {new Date(membership.expiresAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-700 mt-1">
                            Your membership is no longer active. Apply again to regain access to member benefits.
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {membership.status === 'Pending' && (
                        <div className="text-center py-2 text-sm text-gray-600 flex-1">
                            Please wait for approval...
                        </div>
                    )}

                    {membership.status === 'Rejected' && onReapply && (
                        <Button onClick={onReapply} className="flex-1 sm:flex-none">
                            Submit New Application
                        </Button>
                    )}

                    {(isExpired || membership.status === 'Expired') && onRenew && (
                        <Button onClick={onRenew} variant="outline" className="flex-1 sm:flex-none">
                            Apply Again
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
