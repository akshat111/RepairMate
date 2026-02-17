import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import bookingService from '../services/bookingService';

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════

const STATUS_BADGE = {
    pending: 'bg-yellow-100 text-yellow-800',
    assigned: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-slate-100 text-slate-600',
};

const STATUS_LABEL = {
    pending: 'Pending',
    assigned: 'Assigned',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
};

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
    });
};

const formatCost = (amount) => {
    if (amount == null || amount === 0) return '$0.00';
    return `$${Number(amount).toFixed(2)}`;
};

const getDeviceName = (booking) => {
    if (booking.deviceInfo?.brand && booking.deviceInfo?.model)
        return `${booking.deviceInfo.brand} ${booking.deviceInfo.model}`;
    return booking.deviceInfo?.brand || booking.serviceType || 'Device';
};

const getIssueName = (booking) =>
    booking.deviceInfo?.issue || booking.issueType || booking.description?.slice(0, 50) || 'Repair';

const getTechnicianName = (booking) => {
    if (!booking.technician) return null;
    if (booking.technician.user?.name) return booking.technician.user.name;
    return 'Assigned Tech';
};

const getDeviceIcon = (booking) => {
    const brand = (booking.deviceInfo?.brand || '').toLowerCase();
    const svc = (booking.serviceType || '').toLowerCase();
    if (brand.includes('ipad') || brand.includes('tablet') || svc.includes('tablet')) return 'tablet_mac';
    if (brand.includes('mac') || brand.includes('laptop') || svc.includes('laptop')) return 'laptop_mac';
    return 'smartphone';
};

// ═══════════════════════════════════════════════════════
// SKELETON ROW
// ═══════════════════════════════════════════════════════

const SkeletonRow = () => (
    <tr className="animate-pulse">
        <td className="p-4 pl-6"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-slate-200 rounded" /><div className="space-y-1.5"><div className="h-4 bg-slate-200 rounded w-28" /><div className="h-3 bg-slate-200 rounded w-20" /></div></div></td>
        <td className="p-4"><div className="h-4 bg-slate-200 rounded w-24" /></td>
        <td className="p-4"><div className="h-4 bg-slate-200 rounded w-20" /></td>
        <td className="p-4"><div className="h-5 bg-slate-200 rounded-full w-20" /></td>
        <td className="p-4"><div className="h-4 bg-slate-200 rounded w-16" /></td>
        <td className="p-4 pr-6"><div className="h-8 w-8 bg-slate-200 rounded-full ml-auto" /></td>
    </tr>
);

// ═══════════════════════════════════════════════════════
// BOOKINGS PAGE (renders inside DashboardLayout)
// ═══════════════════════════════════════════════════════

const Bookings = () => {
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cancellingId, setCancellingId] = useState(null);

    const fetchBookings = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data } = await bookingService.getMyBookings();
            setBookings(data?.data?.bookings || []);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to load bookings');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchBookings(); }, [fetchBookings]);

    const handleCancel = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) return;
        setCancellingId(id);
        try {
            await bookingService.cancel(id, 'Cancelled by user');
            await fetchBookings();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to cancel booking');
        } finally {
            setCancellingId(null);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Bookings</h1>
                    <p className="text-slate-500 mt-1">View and manage all your repair bookings.</p>
                </div>
                <Link
                    to="/book-repair"
                    className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium shadow-sm shadow-primary/30 transition-all no-underline"
                >
                    <span className="material-icons text-sm mr-2">add</span>
                    Book New Repair
                </Link>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <span className="material-icons text-red-500 mt-0.5">error</span>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-red-800">Something went wrong</p>
                        <p className="text-sm text-red-600 mt-0.5">{error}</p>
                    </div>
                    <button onClick={fetchBookings} className="text-sm font-semibold text-red-700 hover:text-red-900 flex items-center gap-1">
                        <span className="material-icons text-sm">refresh</span> Retry
                    </button>
                </div>
            )}

            {/* Bookings Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                <th className="p-4 pl-6">Device / Issue</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Technician</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Cost</th>
                                <th className="p-4 pr-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
                            ) : bookings.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center">
                                        <span className="material-icons text-4xl text-slate-300 mb-2 block">receipt_long</span>
                                        <p className="text-sm text-slate-500 mb-3">No bookings yet</p>
                                        <Link to="/book-repair" className="text-sm font-semibold text-primary hover:text-primary/80 no-underline">
                                            Book your first repair →
                                        </Link>
                                    </td>
                                </tr>
                            ) : (
                                bookings.map((item) => {
                                    const techName = getTechnicianName(item);
                                    const canCancel = ['pending', 'assigned'].includes(item.status);
                                    return (
                                        <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                                                        <span className="material-icons">{getDeviceIcon(item)}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900">{getDeviceName(item)}</p>
                                                        <p className="text-xs text-slate-500">{getIssueName(item)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-slate-600">{formatDate(item.preferredDate)}</td>
                                            <td className="p-4 text-sm text-slate-600">
                                                {techName ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-purple-500 text-white flex items-center justify-center text-[10px] font-bold">
                                                            {techName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span>{techName}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">Unassigned</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[item.status] || 'bg-slate-100 text-slate-600'}`}>
                                                    {STATUS_LABEL[item.status] || item.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm font-medium text-slate-900">
                                                {formatCost(item.finalCost || item.estimatedCost)}
                                            </td>
                                            <td className="p-4 pr-6 text-right space-x-1">
                                                {canCancel && (
                                                    <button
                                                        onClick={() => handleCancel(item._id)}
                                                        disabled={cancellingId === item._id}
                                                        className="text-slate-400 hover:text-red-500 disabled:opacity-50 transition-colors p-2 rounded-full hover:bg-red-50 inline-flex"
                                                        title="Cancel Booking"
                                                    >
                                                        <span className="material-icons text-xl">
                                                            {cancellingId === item._id ? 'hourglass_empty' : 'cancel'}
                                                        </span>
                                                    </button>
                                                )}
                                                {item.status === 'completed' && (
                                                    <button className="text-slate-400 hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/5 inline-flex" title="Download Invoice">
                                                        <span className="material-icons text-xl">download</span>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Bookings;
