import { useState, useEffect, useCallback } from 'react';
import adminService from '../../services/adminService';

// ═══════════════════════════════════════════════════════
// ADMIN BOOKINGS
// ═══════════════════════════════════════════════════════

const STATUS_TABS = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Assigned', value: 'assigned' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
];

const StatusBadge = ({ status }) => {
    const styles = {
        pending: 'bg-amber-50 text-amber-700 border-amber-200',
        assigned: 'bg-blue-50 text-blue-700 border-blue-200',
        in_progress: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        cancelled: 'bg-red-50 text-red-700 border-red-200',
    };
    return (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${styles[status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
            {status?.replace('_', ' ')?.toUpperCase() || 'UNKNOWN'}
        </span>
    );
};

const PaymentBadge = ({ status }) => {
    const styles = {
        paid: 'text-emerald-600',
        pending: 'text-amber-600',
        refunded: 'text-red-600',
        failed: 'text-red-600',
    };
    return (
        <span className={`text-xs font-medium ${styles[status] || 'text-slate-500'}`}>
            {status?.toUpperCase() || '—'}
        </span>
    );
};

const AdminBookings = () => {
    const [activeTab, setActiveTab] = useState('');
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchBookings = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = { page, limit: 15, sort: '-createdAt' };
            if (activeTab) params.status = activeTab;
            const { data } = await adminService.getAllBookings(params);
            const result = data?.data || data;
            setBookings(result?.bookings || []);
            setTotalPages(result?.pages || 1);
            setTotal(result?.total || 0);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load bookings');
        } finally {
            setLoading(false);
        }
    }, [activeTab, page]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    useEffect(() => {
        setPage(1);
    }, [activeTab]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Bookings</h2>
                    <p className="text-sm text-slate-500 mt-1">{total} total bookings</p>
                </div>
            </div>

            {/* Status Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {STATUS_TABS.map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => setActiveTab(tab.value)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${activeTab === tab.value
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <span className="material-icons text-red-500">error_outline</span>
                    <p className="text-sm text-red-700">{error}</p>
                    <button onClick={fetchBookings} className="ml-auto text-sm font-medium text-red-600 hover:text-red-800">Retry</button>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-6 space-y-3">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="h-4 w-20 bg-slate-100 rounded animate-pulse" />
                                    <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
                                    <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
                                    <div className="h-4 w-20 bg-slate-100 rounded animate-pulse" />
                                    <div className="h-4 w-16 bg-slate-100 rounded animate-pulse" />
                                </div>
                            ))}
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="p-16 text-center">
                            <span className="material-icons text-5xl text-slate-300">search_off</span>
                            <p className="text-slate-500 mt-3 font-medium">No bookings found</p>
                            <p className="text-sm text-slate-400 mt-1">Try changing the filter or check back later</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider bg-slate-50/80">
                                    <th className="px-6 py-3 font-medium">ID</th>
                                    <th className="px-6 py-3 font-medium">Service</th>
                                    <th className="px-6 py-3 font-medium">Customer</th>
                                    <th className="px-6 py-3 font-medium">Technician</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium">Payment</th>
                                    <th className="px-6 py-3 font-medium">Date</th>
                                    <th className="px-6 py-3 font-medium text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {bookings.map((booking) => (
                                    <tr key={booking._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs text-slate-600">
                                            #{booking._id?.slice(-6)?.toUpperCase()}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900 capitalize">
                                            {booking.serviceType}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {booking.customer?.name || booking.user?.name || '—'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {booking.technician?.user?.name || booking.technician?.name || '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={booking.status} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <PaymentBadge status={booking.paymentStatus} />
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {booking.createdAt
                                                ? new Date(booking.createdAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric', month: 'short',
                                                })
                                                : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-semibold text-slate-900">
                                            {booking.estimatedCost != null ? `₹${booking.estimatedCost}` : '—'}
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

export default AdminBookings;
