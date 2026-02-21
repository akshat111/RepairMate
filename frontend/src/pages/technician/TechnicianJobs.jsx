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

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const TechnicianJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [error, setError] = useState(null);

    const fetchJobs = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            // Fetch jobs that are NOT completed or cancelled
            const res = await technicianService.getAssignedBookings();
            const allJobs = res.data?.data?.bookings || [];
            setJobs(allJobs.filter(j => j.status === 'assigned' || j.status === 'in_progress'));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch jobs');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    const handleStartJob = async (id) => {
        try {
            setActionLoading(id);
            await technicianService.startJob(id);
            await fetchJobs();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to start job');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCompleteJob = async (id) => {
        try {
            setActionLoading(id);
            await technicianService.completeJob(id);
            await fetchJobs();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to complete job');
        } finally {
            setActionLoading(null);
        }
    };

    const handleMarkAsPaid = async (id) => {
        if (!window.confirm('Are you sure you want to mark this job as paid?')) return;
        try {
            setActionLoading(`paid-${id}`);
            await technicianService.markJobAsPaid(id);
            await fetchJobs();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to mark job as paid');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <span className="material-icons-round text-4xl text-primary animate-spin">refresh</span>
            </div>
        );
    }

    const assignedJobs = jobs.filter(j => j.status === 'assigned');
    const activeJobs = jobs.filter(j => j.status === 'in_progress');

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">My Jobs</h1>
                <p className="text-slate-500 dark:text-slate-400">Manage your active and upcoming repair jobs.</p>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-2">
                    <span className="material-icons-round">error</span>
                    {error}
                </div>
            )}

            {/* In Progress */}
            {activeJobs.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        In Progress
                    </h2>
                    {activeJobs.map(job => (
                        <div key={job._id} className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border-l-4 border-l-primary shadow-sm border-y border-r border-slate-200 dark:border-slate-800">
                            <div className="flex flex-col sm:flex-row gap-6">
                                <div className="flex-shrink-0">
                                    <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        <span className="material-icons-round text-3xl text-slate-600 dark:text-slate-300">{getDeviceIcon(job.serviceType)}</span>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                        {job.deviceInfo?.brand ? `${job.deviceInfo.brand} ${job.deviceInfo.model}` : job.serviceType}
                                        {job.deviceInfo?.issue ? ` - ${job.deviceInfo.issue}` : ''}
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                                        Started at {formatDate(job.startedAt || job.updatedAt)}
                                    </p>
                                    <div className="mt-4 flex gap-3">
                                        <button
                                            onClick={() => handleCompleteJob(job._id)}
                                            disabled={!!actionLoading}
                                            className="bg-primary hover:bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
                                        >
                                            <span className="material-icons-round text-sm">check_circle</span>
                                            {actionLoading === job._id ? 'Updating...' : 'Mark Completed'}
                                        </button>

                                        {job.paymentStatus !== 'paid' && (
                                            <button
                                                onClick={() => handleMarkAsPaid(job._id)}
                                                disabled={!!actionLoading}
                                                className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
                                            >
                                                <span className="material-icons-round text-sm">payments</span>
                                                {actionLoading === `paid-${job._id}` ? 'Processing...' : 'Mark as Paid'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Assigned */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Upcoming</h2>
                {assignedJobs.length === 0 && activeJobs.length === 0 ? (
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
                        <span className="material-icons-round text-4xl text-slate-300 dark:text-slate-600">assignment_turned_in</span>
                        <p className="mt-3 text-slate-500 dark:text-slate-400 font-medium">No upcoming jobs</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Check the dashboard to accept open jobs.</p>
                    </div>
                ) : (
                    assignedJobs.map(job => (
                        <div key={job._id} className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                            <div className="flex flex-col sm:flex-row gap-6">
                                <div className="flex-shrink-0">
                                    <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        <span className="material-icons-round text-3xl text-slate-600 dark:text-slate-300">{getDeviceIcon(job.serviceType)}</span>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                        {job.deviceInfo?.brand ? `${job.deviceInfo.brand} ${job.deviceInfo.model}` : job.serviceType}
                                        {job.deviceInfo?.issue ? ` - ${job.deviceInfo.issue}` : ''}
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 flex items-center gap-1">
                                        <span className="material-icons-round text-sm">event</span>
                                        Scheduled for {new Date(job.preferredDate).toLocaleDateString()}
                                    </p>
                                    <div className="mt-4 flex gap-3">
                                        <button
                                            onClick={() => handleStartJob(job._id)}
                                            disabled={!!actionLoading}
                                            className="bg-primary hover:bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
                                        >
                                            <span className="material-icons-round text-sm">play_arrow</span>
                                            {actionLoading === job._id ? 'Starting...' : 'Start Job'}
                                        </button>

                                        {job.paymentStatus !== 'paid' && (
                                            <button
                                                onClick={() => handleMarkAsPaid(job._id)}
                                                disabled={!!actionLoading}
                                                className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
                                            >
                                                <span className="material-icons-round text-sm">payments</span>
                                                {actionLoading === `paid-${job._id}` ? 'Processing...' : 'Mark as Paid'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TechnicianJobs;
