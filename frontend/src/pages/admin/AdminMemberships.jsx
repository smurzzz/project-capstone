import { useState, useEffect, useRef } from 'react';
import { Mail, Calendar, RefreshCw, Search, User, Trash2, Users, UserCheck, UserX } from 'lucide-react';
import { Input } from '../../components/ui/input';
import RoleEditModal from '../../components/admin/RoleEditModal';
import { customersAPI, membershipAPI } from '../../utils/api';

export default function AdminMemberships() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [stats, setStats] = useState({ totalMembers: 0, pending: 0, active: 0 });
  const [tableScrollWidth, setTableScrollWidth] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const topScrollRef = useRef(null);
  const bottomScrollRef = useRef(null);
  const tableRef = useRef(null);

  const fetchApplications = async (filters = {}) => {
    setLoading(true);
    try {
      const res = await membershipAPI.getAllApplications(filters);
      const applications = res?.data?.data?.applications || [];
      const items = applications.map(a => ({
        ...a,
        id: a._id,
        name: a.name || a.fullName || 'Unknown',
        email: a.contactInfo?.email || a.email || '',
        role: a.membership?.status === 'Active' || a.membership?.status === 'Approved' ? 'Member' : 'Guest',
        registered: a.applicationSubmittedAt || a.createdAt
      }));
      setCustomers(items);
    } catch (e) {
      console.error('Failed to load membership applications:', e);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await membershipAPI.getMembershipStats();
      setStats(res?.data?.data || {});
    } catch (e) {
      // ignore stats failure
    }
  };

  useEffect(() => {
    // fetch stats once on mount
    fetchStats();
  }, []);

  useEffect(() => {
    const top = topScrollRef.current;
    const bottom = bottomScrollRef.current;

    if (!top || !bottom) return;

    const syncTopToBottom = () => {
      bottom.scrollLeft = top.scrollLeft;
    };

    const syncBottomToTop = () => {
      top.scrollLeft = bottom.scrollLeft;
    };

    top.addEventListener('scroll', syncTopToBottom);
    bottom.addEventListener('scroll', syncBottomToTop);

    const updateTableWidth = () => {
      if (tableRef.current) {
        setTableScrollWidth(tableRef.current.scrollWidth);
      }
    };

    updateTableWidth();
    window.addEventListener('resize', updateTableWidth);

    return () => {
      top.removeEventListener('scroll', syncTopToBottom);
      bottom.removeEventListener('scroll', syncBottomToTop);
      window.removeEventListener('resize', updateTableWidth);
    };
  }, [customers]);

  useEffect(() => {
    // refetch applications when filters change
    const statusParam = roleFilter === 'Member' ? 'Active' : '';
    fetchApplications({ status: statusParam, search: query });
  }, [roleFilter, query]);

  const filtered = customers.filter(c => {
    if (roleFilter !== 'All' && c.role !== roleFilter) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q);
  });

  const total = stats.totalMembers || customers.length;

  const handleOpenRoleModal = (customer) => {
    setSelectedCustomer(customer);
    setActiveModal('role');
  };

  const handleCloseModal = () => {
    setSelectedCustomer(null);
    setActiveModal(null);
  };

  const handleModalSave = async () => {
    await fetchApplications({ status: roleFilter === 'Member' ? 'Active' : '', search: query });
    fetchStats();
  };

  const openCancelMembershipModal = (customer) => {
    setSelectedCustomer(customer);
    setActiveModal('cancel');
  };

  const confirmCancelMembership = async () => {
    if (!selectedCustomer) return;

    try {
      await customersAPI.updateMembership(selectedCustomer._id || selectedCustomer.id, {
        status: 'None',
        tier: 'Silver',
        notes: 'Membership cancelled by admin'
      });
      handleCloseModal();
      await fetchApplications({ status: roleFilter === 'Member' ? 'Active' : '', search: query });
      fetchStats();
    } catch (err) {
      console.error('Failed to cancel membership:', err);
      window.alert(err.response?.data?.message || 'Unable to cancel membership.');
    }
  };
  
  const members = stats.active || customers.filter(c => c.role === 'Member').length;
  const guests = customers.filter(c => c.role === 'Guest').length || Math.max(0, total - members);

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Membership Management</h1>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl">
            Manage membership applications, track member status, and review customer membership activity from one dashboard.
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MembershipStat title="Active" value={members} icon={<UserCheck className="h-8 w-8 text-green-600" />} />
        <MembershipStat title="Guests" value={guests} icon={<Users className="h-8 w-8 text-blue-600" />} />
        <MembershipStat title="Cancelled" value={stats.cancelled || 0} icon={<UserX className="h-8 w-8 text-rose-600" />} />
      </div>

      <div className="mb-4 flex min-h-24 items-center rounded-lg bg-white p-4 shadow-sm">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by name, email, or package..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 pl-10"
            />
          </div>
          <div>
            <select className="h-10 w-full rounded-md border px-3 py-2 text-sm" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="All">All Roles</option>
              <option value="Member">Member</option>
              <option value="Guest">Guest</option>
            </select>
          </div>
          <div>
            <button
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border bg-white px-3 py-2 text-sm hover:bg-slate-50 md:w-auto"
              onClick={() => fetchApplications({ status: roleFilter === 'Member' ? 'Active' : '', search: query })}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-md shadow overflow-hidden">
        <div
          ref={topScrollRef}
          className="overflow-x-auto border-b border-slate-200"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div style={{ width: tableScrollWidth, height: 1 }} />
        </div>
        <div className="overflow-x-auto" ref={bottomScrollRef}>
          <table ref={tableRef} className="min-w-full">
            <thead className="text-xs text-slate-500 border-b bg-slate-50">
              <tr>
                <th className="text-left py-3 px-4">CUSTOMER</th>
                <th className="text-left py-3 px-4">EMAIL</th>
                <th className="text-left py-3 px-4">ROLE</th>
                <th className="text-left py-3 px-4">REGISTERED</th>
                <th className="text-center py-3 px-4 w-24">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500">Loading...</td>
                </tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="border-b last:border-b-0 hover:bg-slate-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-semibold">{(c.name || 'U').split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase()}</div>
                      <div>
                        <div className="font-medium">{c.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-600 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span>{c.email}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${c.role === 'Member' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                      {c.role}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-600 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>{c.registered ? new Date(c.registered).toLocaleDateString() : ''}</span>
                  </td>
                  <td className="py-4 px-4 text-center w-32">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="h-8 w-8 rounded-full border flex items-center justify-center text-slate-600 hover:bg-slate-100"
                        title="Edit membership / change role"
                        onClick={() => handleOpenRoleModal(c)}
                      >
                        <User className="h-4 w-4" />
                      </button>
                      <button
                        className="h-8 w-8 rounded-full border flex items-center justify-center text-rose-600 hover:bg-rose-100"
                        title="Cancel membership"
                        onClick={() => openCancelMembershipModal(c)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-sm text-slate-500 mt-3">Showing {filtered.length} customers</div>

      {activeModal === 'role' && selectedCustomer && (
        <RoleEditModal
          customer={selectedCustomer}
          onClose={handleCloseModal}
          onSave={handleModalSave}
        />
      )}

      {activeModal === 'cancel' && selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal-content modal-sm">
            <div className="modal-header">
              <div>
                <h2>Cancel Membership</h2>
                <p className="modal-intro">Are you sure you want to cancel membership for <strong>{selectedCustomer.name || 'this customer'}</strong>? This action will remove them from active member listings.</p>
              </div>
              <button className="modal-close" onClick={handleCloseModal}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="error-message" style={{ backgroundColor: '#fef3f2', color: '#b91c1c', borderLeftColor: '#f87171' }}>
                This action cannot be undone. The member will be moved to a non-member status and will disappear from the membership table.
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Keep membership
                </button>
                <button type="button" className="btn btn-primary" onClick={confirmCancelMembership}>
                  Confirm cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MembershipStat({ title, value, icon }) {
  return (
    <div className="rounded-lg bg-white shadow-sm">
      <div className="flex min-h-40 items-center p-6">
        <div className="flex w-full items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm text-slate-500">{title}</div>
            <div className="mt-3 break-words text-3xl text-slate-900">{value}</div>
          </div>
          <div className="shrink-0">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}
