import { useState, useEffect, useCallback } from 'react';
import {
    ChevronDown,
    ChevronUp,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    Filter,
    Download,
    RefreshCw
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import {
    Select
} from '../../components/ui/select';
import { membershipAPI } from '../../utils/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';

const STATUS_ICONS = {
    Pending: Clock,
    Approved: CheckCircle,
    Rejected: XCircle,
    Active: CheckCircle,
    Expired: AlertCircle,
    Suspended: AlertCircle
};

const STATUS_COLORS = {
    Pending: 'bg-yellow-50 border-yellow-200',
    Approved: 'bg-green-50 border-green-200',
    Rejected: 'bg-red-50 border-red-200',
    Active: 'bg-green-50 border-green-200',
    Expired: 'bg-gray-50 border-gray-200',
    Suspended: 'bg-red-50 border-red-200'
};

export default function AdminMemberships() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: 'Pending',
        tier: '',
        search: ''
    });
    const [selectedApp, setSelectedApp] = useState(null);
    const [action, setAction] = useState(null); // 'approve', 'reject'
    const [actionReason, setActionReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchApplications = useCallback(async () => {
        try {
            setLoading(true);
            const response = await membershipAPI.getAllApplications({
                status: filters.status,
                tier: filters.tier,
                search: filters.search
            });
            setApplications(response.data.applications || []);
        } catch (error) {
            console.error('Error fetching applications:', error);
            toast.error('Failed to load membership applications');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    const handleApprove = async () => {
        if (!selectedApp) return;

        try {
            setActionLoading(true);
            await membershipAPI.approveApplication(selectedApp._id, {
                notes: actionReason,
                tier: selectedApp.membershipType
            });

            toast.success('Application approved successfully');
            setSelectedApp(null);
            setAction(null);
            setActionReason('');
            fetchApplications();
        } catch (error) {
            console.error('Error approving application:', error);
            toast.error(error.response?.data?.message || 'Failed to approve application');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selectedApp) return;

        try {
            setActionLoading(true);
            await membershipAPI.rejectApplication(selectedApp._id, {
                reason: actionReason
            });

            toast.success('Application rejected');
            setSelectedApp(null);
            setAction(null);
            setActionReason('');
            fetchApplications();
        } catch (error) {
            console.error('Error rejecting application:', error);
            toast.error(error.response?.data?.message || 'Failed to reject application');
        } finally {
            setActionLoading(false);
        }
    };

    const handleExport = () => {
        try {
            const csv = [
                ['ID', 'Full Name', 'Email', 'Phone', 'Tier', 'Status', 'Submitted', 'ID Document'].join(','),
                ...applications.map(app => [
                    app._id,
                    app.fullName,
                    app.email,
                    app.phone,
                    app.membershipType,
                    app.status || 'Pending',
                    new Date(app.createdAt).toLocaleDateString(),
                    app.idDocument ? 'Yes' : 'No'
                ].join(','))
            ].join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `membership-applications-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('Applications exported successfully');
        } catch (error) {
            console.error('Error exporting:', error);
            toast.error('Failed to export applications');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Membership Management</h1>
                    <p className="text-gray-600 mt-1">
                        Review and manage membership applications
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={fetchApplications}
                        disabled={loading}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleExport}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {applications.filter(a => !a.status || a.status === 'Pending').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Approved</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">
                            {applications.filter(a => a.status === 'Approved').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-600">
                            {applications.filter(a => a.status === 'Rejected').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {applications.length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="">All</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Tier</label>
                            <select
                                value={filters.tier}
                                onChange={(e) => setFilters({ ...filters, tier: e.target.value })}
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="">All</option>
                                <option value="Silver">Silver</option>
                                <option value="Gold">Gold</option>
                                <option value="Platinum">Platinum</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Search</label>
                            <Input
                                type="text"
                                placeholder="Name, email, or phone"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="mt-1"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Applications List */}
            <Card>
                <CardHeader>
                    <CardTitle>Applications</CardTitle>
                    <CardDescription>
                        {applications.length} application{applications.length !== 1 ? 's' : ''} found
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                            <p className="mt-4 text-gray-600">Loading applications...</p>
                        </div>
                    ) : applications.length === 0 ? (
                        <div className="text-center py-12">
                            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No applications found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {applications.map((app) => {
                                const StatusIcon = STATUS_ICONS[app.status || 'Pending'];
                                return (
                                    <Card key={app._id} className={`${STATUS_COLORS[app.status || 'Pending']} border-2`}>
                                        <CardContent className="pt-6">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <StatusIcon className="h-5 w-5" />
                                                        <h3 className="text-lg font-semibold">{app.fullName}</h3>
                                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-900">
                                                            {app.membershipType}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                                        <div>
                                                            <p className="text-xs text-gray-600 font-medium">Email</p>
                                                            <p className="text-sm font-medium text-gray-900">{app.email}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-600 font-medium">Phone</p>
                                                            <p className="text-sm font-medium text-gray-900">{app.phone}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-600 font-medium">Submitted</p>
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {new Date(app.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setSelectedApp(app)}
                                                    >
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View
                                                    </Button>
                                                    {(!app.status || app.status === 'Pending') && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                className="bg-green-600 hover:bg-green-700"
                                                                onClick={() => {
                                                                    setSelectedApp(app);
                                                                    setAction('approve');
                                                                }}
                                                            >
                                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => {
                                                                    setSelectedApp(app);
                                                                    setAction('reject');
                                                                }}
                                                            >
                                                                <XCircle className="h-4 w-4 mr-2" />
                                                                Reject
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* View Details Dialog */}
            {selectedApp && !action && (
                <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{selectedApp.fullName}</DialogTitle>
                            <DialogDescription>
                                Application for {selectedApp.membershipType} membership
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                            {/* Personal Info */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-4">Personal Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-600">Full Name</p>
                                        <p className="text-sm font-medium text-gray-900">{selectedApp.fullName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600">Email</p>
                                        <p className="text-sm font-medium text-gray-900">{selectedApp.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600">Phone</p>
                                        <p className="text-sm font-medium text-gray-900">{selectedApp.phone}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600">Membership Tier</p>
                                        <p className="text-sm font-medium text-gray-900">{selectedApp.membershipType}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Address */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-2">Complete Address</h3>
                                <p className="text-sm text-gray-700">{selectedApp.address}</p>
                            </div>

                            {/* ID Document */}
                            {selectedApp.idDocument && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 mb-2">ID Document</h3>
                                    <a
                                        href={selectedApp.idDocument}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                                    >
                                        View Document
                                    </a>
                                </div>
                            )}

                            {/* Additional Notes */}
                            {selectedApp.additionalNotes && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Additional Notes</h3>
                                    <p className="text-sm text-gray-700">{selectedApp.additionalNotes}</p>
                                </div>
                            )}

                            {/* Status */}
                            <div className="pt-4 border-t">
                                <p className="text-xs text-gray-600 mb-2">Application Status</p>
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                    selectedApp.status === 'Approved' ? 'bg-green-100 text-green-900' :
                                    selectedApp.status === 'Rejected' ? 'bg-red-100 text-red-900' :
                                    'bg-yellow-100 text-yellow-900'
                                }`}>
                                    {selectedApp.status || 'Pending'}
                                </span>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedApp(null)}>
                                Close
                            </Button>
                            {(!selectedApp.status || selectedApp.status === 'Pending') && (
                                <>
                                    <Button
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => setAction('approve')}
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Approve
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => setAction('reject')}
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Reject
                                    </Button>
                                </>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Action Dialog (Approve/Reject) */}
            {action && selectedApp && (
                <Dialog open={!!action} onOpenChange={() => {
                    setAction(null);
                    setActionReason('');
                }}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>
                                {action === 'approve' ? 'Approve Application' : 'Reject Application'}
                            </DialogTitle>
                            <DialogDescription>
                                {selectedApp.fullName} - {selectedApp.membershipType} membership
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    {action === 'approve' ? 'Approval Notes' : 'Rejection Reason'}
                                </label>
                                <Textarea
                                    value={actionReason}
                                    onChange={(e) => setActionReason(e.target.value)}
                                    placeholder={
                                        action === 'approve'
                                            ? 'Add any notes about the approval...'
                                            : 'Explain why this application is being rejected...'
                                    }
                                    rows={4}
                                    className="mt-2"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setAction(null);
                                    setActionReason('');
                                }}
                                disabled={actionLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={action === 'approve' ? handleApprove : handleReject}
                                disabled={actionLoading}
                                className={action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                            >
                                {actionLoading ? 'Processing...' : (action === 'approve' ? 'Approve' : 'Reject')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
