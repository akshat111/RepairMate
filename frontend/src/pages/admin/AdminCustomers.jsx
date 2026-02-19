import { useState, useEffect, useCallback } from 'react';
import adminService from '../../services/adminService';

// ═══════════════════════════════════════════════════════
// ADMIN CUSTOMERS
// ═══════════════════════════════════════════════════════

const AdminCustomers = () => {
    const [search, setSearch] = useState('');
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const [menuOpenId, setMenuOpenId] = useState(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = { page, limit: 15, search };
            const { data } = await adminService.getCustomers(params);
            const result = data?.data?.customers || data?.data || [];
            if (Array.isArray(result)) {
                setCustomers(result);
            } else {
                setCustomers([]);
            }
            setTotalPages(data?.pages || 1);
            setTotal(data?.total || 0);
            if (data?.count !== undefined) setTotal(data.total);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load customers');
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    const handleActionClick = (e, id) => {
        e.stopPropagation();
        if (menuOpenId === id) {
            setMenuOpenId(null);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUpwards = spaceBelow < 150; // Threshold for opening up

        setDropdownPos({
            top: openUpwards ? rect.top - 10 : rect.bottom + 8,
            left: rect.right - 192, // 192px is w-48
            origin: openUpwards ? 'origin-bottom-right' : 'origin-top-right',
            transform: openUpwards ? 'translateY(-100%)' : 'none'
        });
        setMenuOpenId(id);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) return;
        try {
            await adminService.deleteCustomer(id);
            setMenuOpenId(null);
            fetchCustomers();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete customer');
        }
    };

    // Debounce search
    useEffect(() => {
        const timeout = setTimeout(fetchCustomers, 500);
        return () => clearTimeout(timeout);
    }, [fetchCustomers]);

    // Close menu on scroll to prevent detached menu
    useEffect(() => {
        const handleScroll = () => { if (menuOpenId) setMenuOpenId(null); };
        window.addEventListener('scroll', handleScroll, true);
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, [menuOpenId]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Customers</h2>
                    <p className="text-sm text-slate-500 mt-1">Manage {total} customer accounts</p>
                </div>

                {/* Search */}
                <div className="relative">
                    <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1); // Reset page on search
                        }}
                        className="pl-9 pr-4 py-2 w-full sm:w-64 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <span className="material-icons text-red-500">error_outline</span>
                    <p className="text-sm text-red-700">{error}</p>
                    <button onClick={fetchCustomers} className="ml-auto text-sm font-medium text-red-600 hover:text-red-800">Retry</button>
                </div>
            )}

            {/* Customers Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-6 space-y-3">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="h-10 w-10 rounded-full bg-slate-100 animate-pulse" />
                                    <div className="h-4 w-32 bg-slate-100 rounded animate-pulse my-auto" />
                                    <div className="h-4 w-48 bg-slate-100 rounded animate-pulse my-auto" />
                                    <div className="h-4 w-24 bg-slate-100 rounded animate-pulse my-auto" />
                                </div>
                            ))}
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="p-16 text-center">
                            <span className="material-icons text-5xl text-slate-300">group_off</span>
                            <p className="text-slate-500 mt-3 font-medium">No customers found</p>
                            <p className="text-sm text-slate-400 mt-1">Try adjusting your search query</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider bg-slate-50/80">
                                    <th className="px-6 py-3 font-medium">Customer</th>
                                    <th className="px-6 py-3 font-medium">Contact</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium">Joined Date</th>
                                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {customers.map((user, index) => (
                                    <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold overflow-hidden">
                                                    {user.avatar ? (
                                                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        user.name?.charAt(0)?.toUpperCase() || 'U'
                                                    )}
                                                </div>
                                                <span className="font-medium text-slate-900">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-slate-900">{user.email}</span>
                                                {user.phone && <span className="text-xs text-slate-500">{user.phone}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.isActive ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {user.createdAt
                                                ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric', month: 'short', year: 'numeric',
                                                })
                                                : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={(e) => handleActionClick(e, user._id)}
                                                className={`transition-colors p-2 rounded-full hover:bg-slate-100 ${menuOpenId === user._id ? 'text-primary bg-primary/5' : 'text-slate-400'}`}
                                            >
                                                <span className="material-icons">more_vert</span>
                                            </button>

                                            {menuOpenId === user._id && (
                                                <>
                                                    <div className="fixed inset-0 z-40 cursor-default" onClick={() => setMenuOpenId(null)} />
                                                    <div
                                                        className={`fixed w-48 bg-white rounded-lg shadow-xl border border-slate-100 z-50 py-1 text-left animate-in fade-in zoom-in-95 duration-100 ${dropdownPos.origin}`}
                                                        style={{
                                                            top: dropdownPos.top,
                                                            left: dropdownPos.left,
                                                            transform: dropdownPos.transform
                                                        }}
                                                    >
                                                        <button
                                                            onClick={() => { setMenuOpenId(null); alert('View details implementation pending'); }}
                                                            className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                                                        >
                                                            <span className="material-icons text-slate-400 text-lg">visibility</span>
                                                            View Details
                                                        </button>
                                                        <div className="h-px bg-slate-100 my-1" />
                                                        <button
                                                            onClick={() => handleDelete(user._id)}
                                                            className="w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                                                        >
                                                            <span className="material-icons text-red-400 text-lg">delete</span>
                                                            Delete Customer
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            Page {page} of {totalPages}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminCustomers;
