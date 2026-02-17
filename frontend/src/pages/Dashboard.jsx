import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import bookingService from '../services/bookingService';

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════

const STATUS_ORDER = ['pending', 'assigned', 'in_progress', 'completed'];

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

const STEP_ICONS = {
    pending: 'schedule',
    assigned: 'person',
    in_progress: 'build_circle',
    completed: 'done_all',
};

const getDeviceIcon = (booking) => {
    const brand = (booking.deviceInfo?.brand || '').toLowerCase();
    const svc = (booking.serviceType || '').toLowerCase();
    if (brand.includes('ipad') || brand.includes('tablet') || svc.includes('tablet')) return 'tablet_mac';
    if (brand.includes('mac') || brand.includes('laptop') || svc.includes('laptop')) return 'laptop_mac';
    return 'smartphone';
};

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
    });
};

const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true,
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

// ═══════════════════════════════════════════════════════
// SKELETON / ERROR
// ═══════════════════════════════════════════════════════

const SkeletonCard = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse">
        <div className="flex gap-4 mb-6">
            <div className="w-16 h-16 bg-slate-200 rounded-lg" />
            <div className="flex-1 space-y-2">
                <div className="h-5 bg-slate-200 rounded w-2/3" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
                <div className="h-3 bg-slate-200 rounded w-1/3" />
            </div>
        </div>
        <div className="flex justify-between">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 bg-slate-200 rounded-full" />
                    <div className="h-3 bg-slate-200 rounded w-12" />
                </div>
            ))}
        </div>
    </div>
);

const SkeletonRow = () => (
    <tr className="animate-pulse">
        <td className="p-4 pl-6"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-slate-200 rounded" /><div className="space-y-1.5"><div className="h-4 bg-slate-200 rounded w-28" /><div className="h-3 bg-slate-200 rounded w-20" /></div></div></td>
        <td className="p-4"><div className="h-4 bg-slate-200 rounded w-24" /></td>
        <td className="p-4"><div className="h-4 bg-slate-200 rounded w-20" /></td>
        <td className="p-4"><div className="h-5 bg-slate-200 rounded-full w-20" /></td>
        <td className="p-4"><div className="h-4 bg-slate-200 rounded w-16" /></td>
        <td className="p-4 pr-6 text-right"><div className="h-8 w-8 bg-slate-200 rounded-full ml-auto" /></td>
    </tr>
);

const ErrorBanner = ({ message, onRetry }) => (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <span className="material-icons text-red-500 mt-0.5">error</span>
        <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Something went wrong</p>
            <p className="text-sm text-red-600 mt-0.5">{message}</p>
        </div>
        {onRetry && (
            <button onClick={onRetry} className="text-sm font-semibold text-red-700 hover:text-red-900 flex items-center gap-1">
                <span className="material-icons text-sm">refresh</span> Retry
            </button>
        )}
    </div>
);

// ═══════════════════════════════════════════════════════
// REPAIR STEPPER
// ═══════════════════════════════════════════════════════

const RepairStepper = ({ booking }) => {
    const currentIdx = STATUS_ORDER.indexOf(booking.status);
    const progressPercent = currentIdx >= 0 ? (currentIdx / (STATUS_ORDER.length - 1)) * 100 : 0;

    return (
        <div className="relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full z-0" />
            <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-0 transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%` }}
            />
            <div className="relative z-10 flex justify-between w-full">
                {STATUS_ORDER.map((status, idx) => {
                    const isCompleted = idx < currentIdx;
                    const isCurrent = idx === currentIdx;
                    const isPending = idx > currentIdx;
                    const historyEntry = booking.statusHistory?.find((h) => h.status === status);

                    return (
                        <div key={status} className={`flex flex-col items-center cursor-default ${isPending ? 'opacity-50' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm ${isCompleted ? 'bg-primary text-white'
                                : isCurrent ? 'bg-white border-2 border-primary text-primary animate-pulse'
                                    : 'bg-slate-200 text-slate-400'
                                }`}>
                                <span className="material-icons text-sm">{isCompleted ? 'check' : STEP_ICONS[status]}</span>
                            </div>
                            <span className={`mt-3 text-xs ${isCompleted || isCurrent ? 'font-bold text-primary' : 'font-semibold text-slate-500'}`}>
                                {STATUS_LABEL[status]}
                            </span>
                            {historyEntry && <span className="text-[10px] text-slate-400">{formatTime(historyEntry.changedAt)}</span>}
                            {isCurrent && !historyEntry && <span className="text-[10px] text-slate-400">Current Stage</span>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════
// TECHNICIAN CARD
// ═══════════════════════════════════════════════════════

const TechnicianCard = ({ technician }) => {
    if (!technician) {
        return (
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex flex-col items-center justify-center text-center">
                <span className="material-icons text-4xl text-slate-300 mb-2">person_search</span>
                <p className="text-sm font-medium text-slate-500">Awaiting Technician Assignment</p>
                <p className="text-xs text-slate-400 mt-1">A technician will be assigned shortly</p>
            </div>
        );
    }

    const name = technician.user?.name || 'Technician';
    const rating = technician.averageRating || 0;
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;
    const isVerified = technician.verificationStatus === 'approved';

    return (
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Technician Details</h4>
            <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-teal-500 text-white flex items-center justify-center font-bold text-lg shadow-md border-2 border-white">
                        {name.charAt(0).toUpperCase()}
                    </div>
                    {technician.isOnline && (
                        <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white" title="Online" />
                    )}
                </div>
                <div>
                    <h5 className="font-bold text-slate-900">{name}</h5>
                    {rating > 0 && (
                        <div className="flex items-center text-xs text-yellow-500 mt-0.5">
                            {Array.from({ length: fullStars }).map((_, i) => <span key={i} className="material-icons text-sm">star</span>)}
                            {hasHalf && <span className="material-icons text-sm">star_half</span>}
                            <span className="ml-1 text-slate-500">({rating.toFixed(1)})</span>
                        </div>
                    )}
                    {isVerified && (
                        <p className="text-xs text-slate-500 mt-1 flex items-center">
                            <span className="material-icons text-[14px] mr-1 text-primary">verified</span> Verified Pro
                        </p>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center w-full py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                    <span className="material-icons text-sm mr-2 text-primary">call</span> Call
                </button>
                <button className="flex items-center justify-center w-full py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                    <span className="material-icons text-sm mr-2 text-primary">chat</span> Message
                </button>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════
// ACTIVE REPAIR
// ═══════════════════════════════════════════════════════

const ActiveRepair = ({ booking }) => {
    const isOnTrack = ['pending', 'assigned', 'in_progress'].includes(booking.status);

    return (
        <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="material-icons text-primary">autorenew</span> Active Repair
                </h2>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isOnTrack ? 'bg-green-100 text-green-800' : STATUS_BADGE[booking.status]}`}>
                    {isOnTrack ? 'On Track' : STATUS_LABEL[booking.status]}
                </span>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 justify-between items-start">
                    <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            <span className="material-icons text-3xl text-slate-400">{getDeviceIcon(booking)}</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900">{getDeviceName(booking)}</h3>
                            <p className="text-sm text-slate-500">{getIssueName(booking)}</p>
                            <p className="text-xs text-slate-400 mt-1">Order ID: #{booking._id?.slice(-8).toUpperCase()}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-slate-500">Preferred Date</p>
                        <p className="text-xl font-bold text-primary">{formatDate(booking.preferredDate)}</p>
                        {booking.preferredTimeSlot && <p className="text-xs text-slate-400 capitalize">{booking.preferredTimeSlot}</p>}
                    </div>
                </div>
                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <RepairStepper booking={booking} />
                        <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                            <div className="flex gap-3">
                                <span className="material-icons text-primary mt-0.5">info</span>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Current Status</p>
                                    <p className="text-sm text-slate-600 mt-1">
                                        {booking.status === 'pending' && 'Your booking is confirmed. Waiting for a technician to be assigned.'}
                                        {booking.status === 'assigned' && 'A technician has been assigned and will arrive at your scheduled time.'}
                                        {booking.status === 'in_progress' && 'Your technician is currently working on the repair.'}
                                        {booking.status === 'completed' && 'Your repair has been completed successfully!'}
                                    </p>
                                    {booking.estimatedCost != null && (
                                        <p className="text-sm text-slate-500 mt-2">
                                            Estimated Cost: <span className="font-semibold text-primary">{formatCost(booking.estimatedCost)}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <TechnicianCard technician={booking.technician} />
                </div>
            </div>
        </section>
    );
};

// ═══════════════════════════════════════════════════════
// REPAIR HISTORY TABLE
// ═══════════════════════════════════════════════════════

const RepairHistory = ({ bookings, isLoading }) => (
    <section>
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Repair History</h2>
            <Link to="/dashboard/bookings" className="text-sm text-slate-500 hover:text-primary flex items-center no-underline">
                View All <span className="material-icons text-lg ml-1">arrow_forward</span>
            </Link>
        </div>
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
                                    <span className="material-icons text-4xl text-slate-300 mb-2 block">history</span>
                                    <p className="text-sm text-slate-500">No repair history yet</p>
                                </td>
                            </tr>
                        ) : (
                            bookings.slice(0, 5).map((item) => {
                                const techName = getTechnicianName(item);
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
                                        <td className="p-4 pr-6 text-right">
                                            <Link
                                                to="/dashboard/bookings"
                                                className="text-slate-400 hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/5 inline-flex no-underline"
                                                title="View Details"
                                            >
                                                <span className="material-icons text-xl">visibility</span>
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
            {bookings.length > 5 && (
                <div className="p-4 border-t border-slate-100 flex justify-center">
                    <Link to="/dashboard/bookings" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors no-underline">
                        View All History →
                    </Link>
                </div>
            )}
        </div>
    </section>
);

// ═══════════════════════════════════════════════════════
// DASHBOARD PAGE (renders inside DashboardLayout)
// ═══════════════════════════════════════════════════════

const Dashboard = () => {
    const [activeBooking, setActiveBooking] = useState(null);
    const [historyBookings, setHistoryBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchBookings = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data } = await bookingService.getMyBookings();
            const bookings = data?.data?.bookings || [];

            const active = bookings.find((b) => ['pending', 'assigned', 'in_progress'].includes(b.status));
            const history = bookings.filter((b) => ['completed', 'cancelled'].includes(b.status));

            setActiveBooking(active || null);
            setHistoryBookings(history);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to load bookings');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchBookings(); }, [fetchBookings]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-500 mt-1">Track your repairs and manage your history.</p>
                </div>
                <Link
                    to="/book-repair"
                    className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium shadow-sm shadow-primary/30 transition-all no-underline"
                >
                    <span className="material-icons text-sm mr-2">add</span>
                    Book New Repair
                </Link>
            </div>

            {error && <ErrorBanner message={error} onRetry={fetchBookings} />}

            {isLoading ? (
                <div className="mb-10">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                        <span className="material-icons text-primary">autorenew</span> Active Repair
                    </h2>
                    <SkeletonCard />
                </div>
            ) : activeBooking ? (
                <ActiveRepair booking={activeBooking} />
            ) : !error ? (
                <section className="mb-10">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                        <span className="material-icons text-primary">autorenew</span> Active Repair
                    </h2>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                        <span className="material-icons text-5xl text-slate-300 mb-3 block">phone_iphone</span>
                        <p className="text-slate-500 mb-4">No active repairs right now</p>
                        <Link to="/book-repair" className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary/80 no-underline">
                            <span className="material-icons text-sm mr-1">add</span>
                            Book a Repair
                        </Link>
                    </div>
                </section>
            ) : null}

            <RepairHistory bookings={historyBookings} isLoading={isLoading} />
        </div>
    );
};

export default Dashboard;
