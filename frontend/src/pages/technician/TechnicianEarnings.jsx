import { useState, useEffect, useCallback } from 'react';
import technicianService from '../../services/technicianService';

const formatCurrency = (amount) => {
    if (amount == null) return '₹0';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
};

const TechnicianEarnings = () => {
    const [earnings, setEarnings] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchEarningsData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const [historyRes, dashboardRes] = await Promise.all([
                technicianService.getMyEarnings({ limit: 50 }),
                technicianService.getEarningsDashboard()
            ]);

            setEarnings(historyRes.data?.data?.earnings || []);
            setSummary(dashboardRes.data?.data?.summary || null);

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch earnings');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEarningsData();
    }, [fetchEarningsData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <span className="material-icons-round text-4xl text-primary animate-spin">refresh</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Earnings & Payouts</h1>
                <p className="text-slate-500 dark:text-slate-400">Track your completed jobs, bonuses, and payment history.</p>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-2">
                    <span className="material-icons-round">error</span>
                    {error}
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Available</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                        {formatCurrency(summary?.totalEarnings)}
                    </h3>
                </div>
                <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Payout</p>
                    <h3 className="text-2xl font-bold text-orange-500 mt-1">
                        {formatCurrency(summary?.pendingPayout)}
                    </h3>
                </div>
                <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Paid Out</p>
                    <h3 className="text-2xl font-bold text-green-500 mt-1">
                        {formatCurrency(summary?.paidOut)}
                    </h3>
                </div>
                <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-gradient-to-br from-primary/5 to-transparent">
                    <p className="text-sm font-medium text-primary">Bonuses</p>
                    <h3 className="text-2xl font-bold text-primary mt-1">
                        {formatCurrency(summary?.totalBonus)}
                    </h3>
                </div>
            </div>

            <div className="bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Detailed History</h2>
                </div>
                {earnings.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-100 dark:border-slate-800/50">
                                <tr>
                                    <th className="px-6 py-4">Job Info</th>
                                    <th className="px-6 py-4">Date Completion</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {earnings.map((earning) => (
                                    <tr key={earning._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                                                {earning.booking?.serviceType} Repair
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                                <span className="material-icons-round text-[12px]">receipt</span>
                                                {earning.booking?._id?.substring(0, 8).toUpperCase() || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                            {new Date(earning.booking?.completedAt || earning.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${earning.status === 'paid'
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                    : earning.status === 'approved'
                                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${earning.status === 'paid' ? 'bg-green-500' : earning.status === 'approved' ? 'bg-blue-500' : 'bg-amber-500'
                                                    }`}></span>
                                                {earning.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="font-bold text-slate-900 dark:text-white">
                                                {formatCurrency(earning.amount)}
                                            </div>
                                            {earning.bonus > 0 && (
                                                <div className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                                                    + {formatCurrency(earning.bonus)} bonus
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                        <span className="material-icons-round text-4xl block mb-2 text-slate-300 dark:text-slate-600">receipt_long</span>
                        <p>No earnings history found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TechnicianEarnings;
