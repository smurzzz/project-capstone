import { Edit, Trash2, User, Mail, Calendar } from 'lucide-react';
import './customer-table.css';

const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const getMembershipBadgeColor = (status) => {
    const colors = {
        'Active': '#10b981',
        'Pending': '#f59e0b',
        'None': '#9ca3af',
        'Suspended': '#ef4444'
    };
    return colors[status] || '#9ca3af';
};

const getRoleBadgeColor = (role) => {
    const colors = {
        admin: '#0ea5e9',
        staff: '#f59e0b',
        customer: '#9ca3af'
    };
    return colors[role] || '#9ca3af';
};

export default function CustomerTable({ 
    customers, 
    onEditMembership, 
    onEditRole, 
    onDelete,
    loading = false 
}) {
    if (loading) {
        return (
            <div className="table-loading">
                <div className="spinner"></div>
                <p>Loading customers...</p>
            </div>
        );
    }

    if (!customers || customers.length === 0) {
        return (
            <div className="table-empty">
                <User size={48} />
                <h3>No Customers Found</h3>
                <p>Start by adding your first customer or check your search filters.</p>
            </div>
        );
    }

    return (
        <div className="customer-table-container">
            <div className="table-wrapper">
                <table className="customer-table">
                    <thead>
                        <tr>
                            <th>Customer</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Membership</th>
                            <th>Registered</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map((customer) => (
                            <tr key={customer._id} className="customer-row">
                                <td className="cell-name">
                                    <div className="customer-cell">
                                        <div className="cell-avatar">
                                            {customer.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="cell-text">{customer.name}</span>
                                    </div>
                                </td>
                                <td className="cell-email">
                                    <div className="cell-email-content">
                                        <Mail size={16} />
                                        <span>{customer.contactInfo?.email}</span>
                                    </div>
                                </td>
                                <td>
                                    <span 
                                        className="badge badge-role"
                                        style={{ borderColor: getRoleBadgeColor(customer.authRole || customer.role), color: getRoleBadgeColor(customer.authRole || customer.role) }}
                                    >
                                        {customer.authRole || customer.role || 'customer'}
                                    </span>
                                </td>
                                <td>
                                    <span 
                                        className="badge badge-membership"
                                        style={{ 
                                            backgroundColor: getMembershipBadgeColor(customer.membership?.status),
                                            color: 'white'
                                        }}
                                    >
                                        {customer.membership?.status === 'None'
                                            ? 'None'
                                            : `${customer.membership?.tier || 'Silver'} · ${customer.membership?.status}`
                                        }
                                    </span>
                                </td>
                                <td className="cell-date">
                                    <Calendar size={14} />
                                    <span>{formatDate(customer.createdAt)}</span>
                                </td>
                                <td className="cell-actions">
                                    <div className="action-buttons">
                                        <button
                                            className="action-btn edit-btn"
                                            title="Edit membership"
                                            onClick={() => onEditMembership(customer)}
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            className="action-btn role-btn"
                                            title="Change role"
                                            onClick={() => onEditRole(customer)}
                                        >
                                            <User size={16} />
                                        </button>
                                        <button
                                            className="action-btn delete-btn"
                                            title="Delete customer"
                                            onClick={() => onDelete(customer)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="table-footer">
                <p className="table-summary">
                    Showing <strong>{customers.length}</strong> customer{customers.length !== 1 ? 's' : ''}
                </p>
            </div>
        </div>
    );
}
