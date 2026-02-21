import { useState, useEffect, useCallback } from 'react';
import adminService from '../../services/adminService';

// ═══════════════════════════════════════════════════════
// ADMIN REVENUE / FINANCE
// ═══════════════════════════════════════════════════════

const PERIOD_OPTIONS = [
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: '90 Days', value: '90d' },
];

const StatCard = ({ icon, label, value, sublabel, color, loading }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300">
        <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                <span className="material-icons text-2xl text-white">{icon}</span>
            </div>
            <div className="flex-1">
                {loading ? (
                    <div className="h-7 w-24 bg-slate-100 rounded animate-pulse" />
                ) : (
                    <p className="text-2xl font-bold text-slate-900">{value ?? '—'}</p>
                )}
                <p className="text-sm text-slate-500 mt-0.5">{label}</p>
                {sublabel && <p className="text-xs text-slate-400 mt-1">{sublabel}</p>}
            </div>
        </div>
    </div>
);

// ── Safe date formatter for backend date objects ──────
const formatDate = (value) => {
    if (value == null) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value.year != null) {
        const y = value.year;
        const m = String(value.month ?? 1).padStart(2, '0');
        const d = String(value.day ?? 1).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    return String(value);
};

const AdminRevenue = () => {
    const [period, setPeriod] = useState('30d');
    const [revenue, setRevenue] = useState(null);
    const [trend, setTrend] = useState([]);
    const [payouts, setPayouts] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [revRes, trendRes, payoutRes] = await Promise.all([
                adminService.getRevenue(period),
                adminService.getRevenueTrend(period, 'daily'),
                adminService.getPayouts(period),
            ]);
            const revResData = revRes.data?.data || revRes.data || {};
            const payoutResData = payoutRes.data?.data || payoutRes.data || {};
            const trendData = trendRes.data?.data || [];

            setRevenue({
                totalRevenue: revResData.revenue?.completedRevenue || 0,
                platformCommission: payoutResData.overview?.totalCommission || 0,
                technicianPayouts: payoutResData.overview?.totalNetPayouts || 0,
                completedJobs: payoutResData.overview?.earningCount || revResData.revenue?.totalBookings || 0,
            });

            setTrend(Array.isArray(trendData) ? trendData.map(t => ({
                date: t._id,
                revenue: t.revenue,
                bookings: t.bookings,
                commission: t.revenue * 0.15
            })) : []);

            const leaderboard = payoutResData.leaderboard || [];
            setPayouts(leaderboard.map(p => ({
                technicianName: p.user?.name || 'Technician',
                completedJobs: p.bookingsCompleted,
                totalEarnings: p.totalEarnings
            })));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load revenue data');
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Revenue & Finance</h2>
                    <p className="text-sm text-slate-500 mt-1">Financial insights from backend data</p>
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

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <span className="material-icons text-red-500">error_outline</span>
                    <p className="text-sm text-red-700">{error}</p>
                    <button onClick={fetchData} className="ml-auto text-sm font-medium text-red-600 hover:text-red-800">Retry</button>
                </div>
            )}

            {/* Revenue Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard
                    icon="account_balance_wallet"
                    label="Total Revenue"
                    value={revenue?.totalRevenue != null ? `₹${revenue.totalRevenue.toLocaleString()}` : null}
                    color="bg-gradient-to-br from-emerald-500 to-emerald-600"
                    loading={loading}
                />
                <StatCard
                    icon="percent"
                    label="Platform Commission"
                    value={revenue?.platformCommission != null ? `₹${revenue.platformCommission.toLocaleString()}` : null}
                    sublabel="15% commission rate"
                    color="bg-gradient-to-br from-blue-500 to-blue-600"
                    loading={loading}
                />
                <StatCard
                    icon="payments"
                    label="Technician Payouts"
                    value={revenue?.technicianPayouts != null ? `₹${revenue.technicianPayouts.toLocaleString()}` : null}
                    color="bg-gradient-to-br from-violet-500 to-violet-600"
                    loading={loading}
                />
                <StatCard
                    icon="receipt_long"
                    label="Completed Jobs"
                    value={revenue?.completedJobs}
                    color="bg-gradient-to-br from-amber-500 to-amber-600"
                    loading={loading}
                />
            </div>

            {/* Revenue Trend Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-900">Revenue Trend (Daily)</h3>
                </div>
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-6 space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
                                    <div className="h-4 w-20 bg-slate-100 rounded animate-pulse" />
                                    <div className="h-4 w-16 bg-slate-100 rounded animate-pulse" />
                                </div>
                            ))}
                        </div>
                    ) : trend.length === 0 ? (
                        <div className="p-12 text-center">
                            <span className="material-icons text-4xl text-slate-300">show_chart</span>
                            <p className="text-sm text-slate-500 mt-2">No revenue data for this period</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider bg-slate-50/80">
                                    <th className="px-6 py-3 font-medium">Date</th>
                                    <th className="px-6 py-3 font-medium">Revenue</th>
                                    <th className="px-6 py-3 font-medium">Bookings</th>
                                    <th className="px-6 py-3 font-medium">Commission</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {trend.map((row, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-slate-600">
                                            {formatDate(row._id) || formatDate(row.date) || `Day ${i + 1}`}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-slate-900">
                                            ₹{(row.revenue || row.totalRevenue || 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {row.count || row.bookings || 0}
                                        </td>
                                        <td className="px-6 py-4 text-emerald-600 font-medium">
                                            ₹{(row.commission || row.platformCommission || 0).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Technician Payouts Summary */}
            {payouts && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100">
                        <h3 className="font-semibold text-slate-900">Technician Payouts</h3>
                    </div>
                    <div className="p-6">
                        {Array.isArray(payouts) && payouts.length > 0 ? (
                            <div className="space-y-3">
                                {payouts.map((payout, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-indigo-500 text-white flex items-center justify-center font-bold text-sm">
                                                {payout.technicianName?.charAt(0) || 'T'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">{payout.technicianName || 'Technician'}</p>
                                                <p className="text-xs text-slate-500">{payout.completedJobs || 0} jobs</p>
                                            </div>
                                        </div>
                                        <p className="font-semibold text-slate-900">
                                            ₹{(payout.totalEarnings || payout.amount || 0).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <span className="material-icons text-3xl text-slate-300">payments</span>
                                <p className="text-sm text-slate-500 mt-2">No payout data available</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminRevenue;
