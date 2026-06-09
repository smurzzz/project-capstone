import React from 'react';
import { Eye, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '../../components/ui/button';

const Avatar = ({ name }) => {
    const initials = (name || 'U').split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();
    return (
        <div className="h-8 w-8 rounded-full bg-slate-400 flex items-center justify-center text-white font-semibold">{initials}</div>
    );
};

export default function MembersTable({ applications = [], onView, loading = false, sortBy, sortDir, onSort }) {
    return (
        <div className="overflow-x-auto">
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
            ) : (
                <table className="min-w-full text-sm text-left bg-white rounded-md">
                    <thead>
                        <tr className="text-xs text-slate-500 border-b">
                            <th className="py-3 pl-4">
                                <button type="button" className="inline-flex items-center gap-2" onClick={() => onSort && onSort('name')}>
                                    Customer
                                    {sortBy === 'name' && (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                                </button>
                            </th>
                            <th className="py-3">Email</th>
                            <th className="py-3">Role</th>
                            <th className="py-3">
                                <button type="button" className="inline-flex items-center gap-2" onClick={() => onSort && onSort('createdAt')}>
                                    Registered
                                    {sortBy === 'createdAt' && (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                                </button>
                            </th>
                            <th className="py-3 pr-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {applications.map((app) => {
                            const status = app.membership?.status || 'Guest';
                            const roleLabel = (app.membership?.status === 'Active') ? 'Member' : 'Guest';
                            const registeredAt = app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '';
                            return (
                                <tr key={app._id} className="bg-white hover:bg-slate-50 transition-colors">
                                    <td className="py-4 pl-4 align-middle">
                                        <div className="flex items-center gap-3">
                                            <Avatar name={app.name} />
                                            <div>
                                                <div className="font-medium text-slate-900">{app.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4">{app.contactInfo?.email || ''}</td>
                                    <td className="py-4">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${roleLabel === 'Member' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                                            {roleLabel}
                                        </span>
                                    </td>
                                    <td className="py-4">{registeredAt}</td>
                                    <td className="py-4 pr-4 text-right">
                                        <div className="inline-flex items-center gap-2">
                                            <Button size="sm" variant="ghost" onClick={() => onView && onView(app)}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
}
