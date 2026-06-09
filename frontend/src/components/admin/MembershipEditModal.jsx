import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { customersAPI } from '../../utils/api';
import './modal.css';

const MEMBERSHIP_TIERS = ['Silver', 'Gold', 'Platinum'];
const MEMBERSHIP_STATUSES = ['None', 'Pending', 'Active', 'Suspended'];

export default function MembershipEditModal({ customer, onClose, onSave }) {
    const [formData, setFormData] = useState({
        status: customer?.membership?.status || 'None',
        tier: customer?.membership?.tier || 'Silver',
        expiresAt: customer?.membership?.expiresAt 
            ? new Date(customer.membership.expiresAt).toISOString().split('T')[0]
            : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await customersAPI.updateMembership(customer._id, {
                status: formData.status,
                tier: formData.tier,
                expiresAt: formData.expiresAt,
                notes: formData.notes
            });
            onSave();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update membership');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2>Edit Membership</h2>
                        <p className="modal-intro">Adjust membership status, expiration, tier, and notes in a single streamlined workflow.</p>
                    </div>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="customer-info-badge">
                        <div className="customer-avatar">
                            {customer?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="customer-name">{customer?.name}</p>
                            <p className="customer-email">{customer?.contactInfo?.email}</p>
                        </div>
                    </div>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="membership-form">
                        <div className="form-group">
                            <label htmlFor="status">Membership Status</label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                required
                            >
                                {MEMBERSHIP_STATUSES.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="tier">Membership Tier</label>
                            <select
                                id="tier"
                                name="tier"
                                value={formData.tier}
                                onChange={handleChange}
                                required
                                disabled={formData.status === 'None'}
                            >
                                {MEMBERSHIP_TIERS.map(tier => (
                                    <option key={tier} value={tier}>{tier}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="expiresAt">Expiration Date</label>
                            <input
                                id="expiresAt"
                                type="date"
                                name="expiresAt"
                                value={formData.expiresAt}
                                onChange={handleChange}
                                disabled={formData.status === 'None'}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="notes">Notes</label>
                            <textarea
                                id="notes"
                                name="notes"
                                placeholder="Add any notes about this membership change..."
                                value={formData.notes}
                                onChange={handleChange}
                                rows="3"
                            />
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
