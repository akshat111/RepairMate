import { useState, useEffect, useCallback } from 'react';
import adminService from '../../services/adminService';

// ═══════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════

const PERIOD_OPTIONS = [
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: '90 Days', value: '90d' },
];

// ── Stat Card ─────────────────────────────────────────
const StatCard = ({ icon, label, value, trend, color, loading }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300">
        <div className="flex items-start justify-between">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                <span className="material-icons text-2xl text-white">{icon}</span>
            </div>
            {trend !== undefined && trend !== null && (
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                    {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
                </span>
            )}
        </div>
        <div className="mt-4">
            {loading ? (
                <div className="h-8 w-24 bg-slate-100 rounded animate-pulse" />
            ) : (
                <p className="text-2xl font-bold text-slate-900">{value ?? '—'}</p>
            )}
            <p className="text-sm text-slate-500 mt-1">{label}</p>
        </div>
    </div>
);

// ── Loading Skeleton ──────────────────────────────────
const TableSkeleton = ({ rows = 5 }) => (
    <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex gap-4 items-center">
                <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
                <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
                <div className="h-4 w-20 bg-slate-100 rounded animate-pulse" />
                <div className="h-4 w-16 bg-slate-100 rounded animate-pulse" />
            </div>
        ))}
    </div>
);

// ── Status Badge ──────────────────────────────────────
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

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

const AdminDashboard = () => {
    const [period, setPeriod] = useState('30d');
    const [dashboard, setDashboard] = useState(null);
    const [recentBookings, setRecentBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [dashRes, bookingsRes] = await Promise.all([
                adminService.getDashboard(period),
                adminService.getAllBookings({ limit: 8, sort: '-createdAt' }),
            ]);
            setDashboard(dashRes.data?.data || dashRes.data || null);
            const bookingData = bookingsRes.data?.data?.bookings || bookingsRes.data?.data || [];
            setRecentBookings(Array.isArray(bookingData) ? bookingData : []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Extract metrics from dashboard data
    const metrics = dashboard || {};

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Overview</h2>
                    <p className="text-sm text-slate-500 mt-1">Monitor your platform performance</p>
                </div>
                <div className="flex gap-2">
                    {PERIOD_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setPeriod(opt.value)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${period === opt.value
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Error state */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <span className="material-icons text-red-500">error_outline</span>
                    <p className="text-sm text-red-700">{error}</p>
                    <button onClick={fetchData} className="ml-auto text-sm font-medium text-red-600 hover:text-red-800">Retry</button>
                </div>
            )}

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard
                    icon="account_balance_wallet"
                    label="Total Revenue"
                    value={metrics.totalRevenue != null ? `₹${metrics.totalRevenue.toLocaleString()}` : null}
                    trend={metrics.revenueGrowth}
                    color="bg-gradient-to-br from-emerald-500 to-emerald-600"
                    loading={loading}
                />
                <StatCard
                    icon="receipt_long"
                    label="Total Bookings"
                    value={metrics.totalBookings}
                    trend={metrics.bookingGrowth}
                    color="bg-gradient-to-br from-blue-500 to-blue-600"
                    loading={loading}
                />
                <StatCard
                    icon="pending_actions"
                    label="Active Bookings"
                    value={metrics.activeBookings}
                    color="bg-gradient-to-br from-amber-500 to-amber-600"
                    loading={loading}
                />
                <StatCard
                    icon="engineering"
                    label="Online Technicians"
                    value={metrics.onlineTechnicians}
                    color="bg-gradient-to-br from-violet-500 to-violet-600"
                    loading={loading}
                />
            </div>

            {/* Recent Bookings */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">Recent Booking Activity</h3>
                    <a href="/admin/bookings" className="text-sm font-medium text-primary hover:underline no-underline">
                        View All →
                    </a>
                </div>
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-6">
                            <TableSkeleton />
                        </div>
                    ) : recentBookings.length === 0 ? (
                        <div className="p-12 text-center">
                            <span className="material-icons text-4xl text-slate-300">inbox</span>
                            <p className="text-sm text-slate-500 mt-2">No bookings yet</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider bg-slate-50/80">
                                    <th className="px-6 py-3 font-medium">Booking ID</th>
                                    <th className="px-6 py-3 font-medium">Service</th>
                                    <th className="px-6 py-3 font-medium">Customer</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium">Date</th>
                                    <th className="px-6 py-3 font-medium text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {recentBookings.map((booking) => (
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
                                        <td className="px-6 py-4">
                                            <StatusBadge status={booking.status} />
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {booking.createdAt
                                                ? new Date(booking.createdAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric', month: 'short', year: 'numeric',
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
            </div>
        </div>
    );
};

export default AdminDashboard;
