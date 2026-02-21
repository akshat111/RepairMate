import { useState, useEffect, useCallback } from 'react';
import technicianService from '../../services/technicianService';

const getDeviceIcon = (serviceType = '') => {
    const lower = serviceType.toLowerCase();
    if (lower.includes('laptop')) return 'laptop_mac';
    if (lower.includes('phone')) return 'smartphone';
    if (lower.includes('tablet')) return 'tablet_mac';
    if (lower.includes('desktop')) return 'desktop_windows';
    return 'devices';
};

const formatCurrency = (amount) => {
    if (amount == null) return '₹0';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
};

const TechnicianHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchHistory = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            // Fetch completed and cancelled jobs
            const [completedRes, cancelledRes] = await Promise.allSettled([
                technicianService.getAssignedBookings({ status: 'completed' }),
                technicianService.getAssignedBookings({ status: 'cancelled' })
            ]);

            let merged = [];
            if (completedRes.status === 'fulfilled') {
                merged = [...merged, ...(completedRes.value.data?.data?.bookings || [])];
            }
            if (cancelledRes.status === 'fulfilled') {
                merged = [...merged, ...(cancelledRes.value.data?.data?.bookings || [])];
            }

            // Sort by descending updatedAt
            merged.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            setHistory(merged);
        } catch (err) {
            setError('Failed to fetch job history');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

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
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Job History</h1>
                <p className="text-slate-500 dark:text-slate-400">View your completed and cancelled repair jobs.</p>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-2">
                    <span className="material-icons-round">error</span>
                    {error}
                </div>
            )}

            {history.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {history.map((job) => (
                        <div key={job._id} className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative">
                            {job.status === 'completed' && (
                                <div className="absolute top-4 right-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider">
                                    <span className="material-icons-round text-[12px]">check_circle</span> Completed
                                </div>
                            )}
                            {job.status === 'cancelled' && (
                                <div className="absolute top-4 right-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider">
                                    <span className="material-icons-round text-[12px]">cancel</span> Cancelled
                                </div>
                            )}

                            <div className="flex items-center gap-4 mb-4 mt-2">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${job.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                    <span className="material-icons-round text-2xl">{getDeviceIcon(job.serviceType)}</span>
                                </div>
                                <div className="flex-1 pr-16 truncate">
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                                        {job.deviceInfo?.brand || job.serviceType} {job.deviceInfo?.model || ''}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                        {job.user?.name || 'Customer'}
                                    </p>
                                </div>
                            </div>

                            <div className="text-sm text-slate-600 dark:text-slate-300 mb-3 line-clamp-2 min-h-10">
                                {job.deviceInfo?.issue || job.description || 'No description provided.'}
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <span className="material-icons-round text-xs">calendar_today</span>
                                    {new Date(job.updatedAt).toLocaleDateString()}
                                </div>
                                {job.status === 'completed' && job.finalCost > 0 && (
                                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                                        {formatCurrency(job.finalCost)}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
                    <span className="material-icons-round text-5xl text-slate-300 dark:text-slate-600 mb-4 block">history</span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No history yet</h3>
                    <p className="text-slate-500 dark:text-slate-400">You haven't completed or cancelled any jobs yet.</p>
                </div>
            )}
        </div>
    );
};

export default TechnicianHistory;
