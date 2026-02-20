import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import technicianService from '../services/technicianService';

// ═══════════════════════════════════════════════════════
// TECHNICIAN DASHBOARD
// ═══════════════════════════════════════════════════════

const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/technician/dashboard' },
    { id: 'jobs', label: 'My Jobs', icon: 'assignment', path: '/technician/jobs' },
    { id: 'history', label: 'Job History', icon: 'history', path: '/technician/history' },
    { id: 'inventory', label: 'Parts Inventory', icon: 'inventory_2', path: '/technician/inventory' },
    { id: 'earnings', label: 'Earnings', icon: 'payments', path: '/technician/earnings' },
];

// Map booking serviceType to material icon
const SERVICE_ICON_MAP = {
    laptop: 'laptop_mac',
    phone: 'smartphone',
    tablet: 'tablet_mac',
    desktop: 'desktop_windows',
    tv: 'tv',
    printer: 'print',
    default: 'devices',
};

const getDeviceIcon = (serviceType = '') => {
    const lower = serviceType.toLowerCase();
    for (const [key, icon] of Object.entries(SERVICE_ICON_MAP)) {
        if (lower.includes(key)) return icon;
    }
    return SERVICE_ICON_MAP.default;
};

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatCurrency = (amount) => {
    if (amount == null) return '₹0';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
};

const TechnicianDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isOnline, setIsOnline] = useState(true);
    const [activeNav, setActiveNav] = useState('dashboard');

    const [bookings, setBookings] = useState([]);
    const [openBookings, setOpenBookings] = useState([]);
    const [earnings, setEarnings] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(null); // bookingId being actioned
    const [noProfile, setNoProfile] = useState(false); // technician profile not yet created

    // ── Fetch data ──────────────────────────────────────
    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            setNoProfile(false);

            // Fetch profile first to check verification status
            let currentProfile = null;
            try {
                const profileRes = await technicianService.getMyProfile();
                currentProfile = profileRes.data?.data?.technician;
                setProfile(currentProfile);
            } catch (err) {
                if (err.response?.status === 404) {
                    setNoProfile(true);
                    return; // Stop if no profile
                }
                throw err;
            }

            // Only fetch bookings and earnings if profile is approved or pending
            // (Even if pending, we still load dashboard structure, just with a banner)
            if (currentProfile) {
                const [bookingsRes, openBookingsRes, earningsRes] = await Promise.allSettled([
                    technicianService.getAssignedBookings(),
                    technicianService.getOpenBookings(),
                    technicianService.getEarningsDashboard(),
                ]);

                if (bookingsRes.status === 'fulfilled') {
                    setBookings(bookingsRes.value.data?.data?.bookings || []);
                }
                if (openBookingsRes.status === 'fulfilled') {
                    setOpenBookings(openBookingsRes.value.data?.data?.bookings || []);
                }
                if (earningsRes.status === 'fulfilled') {
                    setEarnings(earningsRes.value.data?.data || null);
                }
            }

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // ── Derived stats ───────────────────────────────────
    const isPending = profile?.verificationStatus === 'pending';
    const isRejected = profile?.verificationStatus === 'rejected';

    const todayStr = new Date().toDateString();
    const todayBookings = bookings.filter(
        (b) => new Date(b.preferredDate).toDateString() === todayStr
    );
    const pendingBookings = bookings.filter(
        (b) => b.status === 'assigned' || b.status === 'pending'
    );
    const completedBookings = bookings.filter((b) => b.status === 'completed');
    const activeJobs = bookings.filter((b) => b.status === 'in_progress');
    const upcomingJobs = bookings.filter(
        (b) => b.status === 'assigned'
    );
    const assignedJobsCount = bookings.filter(
        (b) => b.status !== 'completed' && b.status !== 'cancelled'
    ).length;

    // ── Job actions ─────────────────────────────────────
    const handleStartJob = async (bookingId) => {
        try {
            setActionLoading(bookingId);
            await technicianService.startJob(bookingId);
            await fetchDashboardData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to start job');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCompleteJob = async (bookingId) => {
        try {
            setActionLoading(bookingId);
            await technicianService.completeJob(bookingId);
            await fetchDashboardData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to complete job');
        } finally {
            setActionLoading(null);
        }
    };

    const handleAcceptJob = async (bookingId) => {
        try {
            setActionLoading(bookingId);
            await technicianService.acceptJob(bookingId);
            await fetchDashboardData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to accept job');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectJob = async (bookingId) => {
        try {
            setActionLoading(bookingId);
            await technicianService.rejectJob(bookingId, 'Not available');
            await fetchDashboardData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reject job');
        } finally {
            setActionLoading(null);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleNavClick = (item) => {
        setActiveNav(item.id);
        navigate(item.path);
    };

    // ── Loading state ───────────────────────────────────
    if (loading) {
        return (
            <div className="bg-background-light dark:bg-background-dark font-display text-slate-800 dark:text-slate-100 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <span className="material-icons-round text-5xl text-primary animate-spin">refresh</span>
                    <p className="mt-4 text-slate-500 font-medium">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    // ── No profile state ────────────────────────────────
    if (noProfile) {
        return (
            <div className="bg-background-light dark:bg-background-dark font-display text-slate-800 dark:text-slate-100 min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-6">
                        <span className="material-icons-round text-4xl text-orange-500">engineering</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Technician Profile Not Found</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">
                        Your account has the technician role, but no technician profile has been created yet.
                        Please contact an administrator or register your technician profile.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-primary hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-800 dark:text-slate-100 min-h-screen flex flex-col antialiased transition-colors duration-200">
            {/* Navbar */}
            <header className="bg-surface-light dark:bg-surface-dark border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 h-16 flex items-center justify-between px-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                            <span className="material-icons-round text-xl">build</span>
                        </div>
                        <Link to="/" className="no-underline">
                            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Repair<span className="text-primary">Mate</span></h1>
                        </Link>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    {/* Global Status Toggle */}
                    <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Status:</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                checked={isOnline}
                                onChange={() => setIsOnline(!isOnline)}
                                className="sr-only peer"
                                type="checkbox"
                            />
                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                            {isOnline ? (
                                <span className="ml-3 text-sm font-bold text-green-600 dark:text-green-400">Online</span>
                            ) : (
                                <span className="ml-3 text-sm font-bold text-slate-500">Offline</span>
                            )}
                        </label>
                    </div>
                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
                    <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={handleLogout} title="Logout">
                        <div className="w-9 h-9 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                            {user?.name?.charAt(0)?.toUpperCase() || 'T'}
                        </div>
                        <div className="hidden md:block leading-tight">
                            <p className="text-sm font-bold">{user?.name || 'Technician'}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Technician</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden h-[calc(100vh-4rem)]">
                {/* Sidebar Navigation */}
                <aside className="w-64 bg-surface-light dark:bg-surface-dark border-r border-slate-200 dark:border-slate-800 hidden lg:flex flex-col justify-between p-4">
                    <nav className="space-y-2">
                        {NAV_ITEMS.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleNavClick(item)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-left ${activeNav === item.id
                                    ? 'bg-primary/10 text-primary font-semibold'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <span className="material-icons-round">{item.icon}</span>
                                {item.label}
                                {item.id === 'jobs' && assignedJobsCount > 0 && (
                                    <span className="ml-auto bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">{assignedJobsCount}</span>
                                )}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8 grid grid-cols-1 xl:grid-cols-3 gap-6 relative">
                    {/* Verification Status Banner */}
                    {(isPending || isRejected) && (
                        <div className="xl:col-span-3">
                            <div className={`p-4 rounded-xl shadow-sm border flex items-start gap-4 ${isPending ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isPending ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                                    <span className="material-icons-round">{isPending ? 'pending_actions' : 'gpp_bad'}</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-bold ${isPending ? 'text-amber-800' : 'text-red-800'}`}>
                                        {isPending ? 'Account Pending Verification' : 'Account Rejected'}
                                    </h3>
                                    <p className={`text-sm mt-1 ${isPending ? 'text-amber-700' : 'text-red-700'}`}>
                                        {isPending
                                            ? 'Your technician profile is currently under review by our administration team. You cannot accept repair jobs until your account is approved. This usually takes 1-2 business days.'
                                            : `Unfortunately, your technician application has been rejected. Reason: ${profile?.rejectionReason || 'No reason provided.'} Please contact support for more information.`
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Left Column: Assigned Jobs Feed (Span 2) */}
                    <div className="xl:col-span-2 space-y-6">

                        {/* Error Banner */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-xl text-sm flex items-center gap-2">
                                <span className="material-icons-round text-sm">error</span>
                                {error}
                                <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
                                    <span className="material-icons-round text-sm">close</span>
                                </button>
                            </div>
                        )}

                        {/* Quick Stats Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Jobs Today</p>
                                    <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{todayBookings.length}</h3>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-primary">
                                    <span className="material-icons-round">calendar_today</span>
                                </div>
                            </div>
                            <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Pending</p>
                                    <h3 className="text-2xl font-bold mt-1 text-orange-500">{pendingBookings.length}</h3>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-500">
                                    <span className="material-icons-round">hourglass_empty</span>
                                </div>
                            </div>
                            <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Completed</p>
                                    <h3 className="text-2xl font-bold mt-1 text-green-500">{completedBookings.length}</h3>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-500">
                                    <span className="material-icons-round">check_circle</span>
                                </div>
                            </div>
                        </div>

                        {/* ══════════════════════════════════════════════ */}
                        {/* OPEN BOOKINGS SECTION                        */}
                        {/* ══════════════════════════════════════════════ */}
                        <div className="flex items-center justify-between mt-8 mb-4">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Open Repair Jobs</h2>
                                {openBookings.length > 0 && (
                                    <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                                        {openBookings.length} available
                                    </span>
                                )}
                            </div>
                            <button className="px-3 py-1.5 text-sm font-medium bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700" onClick={fetchDashboardData}>Refresh</button>
                        </div>

                        {openBookings.length > 0 ? (
                            <div className="space-y-4">
                                {openBookings.map((job) => (
                                    <div key={job._id} className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-amber-200 dark:border-amber-800/50 overflow-hidden relative hover:shadow-md transition-shadow">
                                        <div className="absolute top-4 right-4 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                            AVAILABLE
                                        </div>
                                        <div className="p-6">
                                            <div className="flex flex-col sm:flex-row gap-6">
                                                <div className="flex-shrink-0">
                                                    <div className="w-16 h-16 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                                                        <span className="material-icons-round text-4xl text-amber-600 dark:text-amber-400">{getDeviceIcon(job.serviceType)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="mb-2 pr-32">
                                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                                            {job.deviceInfo?.brand && job.deviceInfo?.model
                                                                ? `${job.deviceInfo.brand} ${job.deviceInfo.model}`
                                                                : job.serviceType}
                                                            {job.deviceInfo?.issue ? ` - ${job.deviceInfo.issue}` : ''}
                                                        </h3>
                                                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{job.description}</p>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-sm">
                                                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                                            <span className="material-icons-round text-sm">person</span>
                                                            <span>{job.user?.name || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                                            <span className="material-icons-round text-sm">location_on</span>
                                                            <span>
                                                                {job.address
                                                                    ? [job.address.street, job.address.city].filter(Boolean).join(', ')
                                                                    : 'N/A'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                                            <span className="material-icons-round text-sm">schedule</span>
                                                            <span>{job.preferredTimeSlot ? job.preferredTimeSlot.charAt(0).toUpperCase() + job.preferredTimeSlot.slice(1) : 'Flexible'}</span>
                                                        </div>
                                                    </div>
                                                    {job.estimatedCost && (
                                                        <div className="mb-4">
                                                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Estimated Pay: </span>
                                                            <span className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(job.estimatedCost)}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                                        <button
                                                            onClick={() => handleAcceptJob(job._id)}
                                                            disabled={actionLoading === job._id || isPending}
                                                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
                                                        >
                                                            <span className="material-icons-round text-sm">check_circle</span>
                                                            {actionLoading === job._id ? 'Accepting...' : 'Accept Job'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
                                <span className="material-icons-round text-4xl text-slate-300 dark:text-slate-600">notifications_none</span>
                                <p className="mt-3 text-slate-500 dark:text-slate-400 font-medium">No open repair jobs available right now</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">When a customer needs a repair in your area, you'll see it here.</p>
                            </div>
                        )}

                        {/* ══════════════════════════════════════════════ */}
                        {/* UPCOMING ASSIGNED JOBS SECTION               */}
                        {/* ══════════════════════════════════════════════ */}
                        {upcomingJobs.length > 0 && (
                            <>
                                <div className="flex items-center justify-between mt-8 mb-4">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Upcoming Jobs</h2>
                                        <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
                                            {upcomingJobs.length} assigned
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {upcomingJobs.map((job) => (
                                        <div key={job._id} className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-md border-l-4 border-l-blue-500 border-y border-r border-slate-200 dark:border-slate-700 overflow-hidden relative">
                                            <div className="absolute top-4 right-4 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                                ASSIGNED
                                            </div>
                                            <div className="p-6">
                                                <div className="flex flex-col sm:flex-row gap-6">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                            <span className="material-icons-round text-4xl text-slate-600 dark:text-slate-300">{getDeviceIcon(job.serviceType)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="mb-4 pr-24">
                                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                                                {job.deviceInfo?.brand && job.deviceInfo?.model
                                                                    ? `${job.deviceInfo.brand} ${job.deviceInfo.model}`
                                                                    : job.serviceType}
                                                                {job.deviceInfo?.issue ? ` - ${job.deviceInfo.issue}` : ''}
                                                            </h3>
                                                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 flex items-center gap-1">
                                                                <span className="material-icons-round text-sm">event</span>
                                                                Scheduled for {new Date(job.preferredDate).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                            <div className="flex items-start gap-2">
                                                                <span className="material-icons-round text-slate-400 text-sm mt-0.5">person</span>
                                                                <div>
                                                                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Customer</p>
                                                                    <p className="text-sm font-medium">{job.user?.name || 'N/A'}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-start gap-2">
                                                                <span className="material-icons-round text-slate-400 text-sm mt-0.5">location_on</span>
                                                                <div>
                                                                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Location</p>
                                                                    <p className="text-sm font-medium">
                                                                        {job.address
                                                                            ? [job.address.street, job.address.city].filter(Boolean).join(', ')
                                                                            : 'N/A'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <button
                                                                onClick={() => handleStartJob(job._id)}
                                                                disabled={actionLoading === job._id}
                                                                className="bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
                                                            >
                                                                <span className="material-icons-round text-sm">play_arrow</span>
                                                                {actionLoading === job._id ? 'Starting...' : 'Start Job'}
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectJob(job._id)}
                                                                disabled={actionLoading === job._id}
                                                                className="bg-white dark:bg-surface-dark border border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
                                                            >
                                                                <span className="material-icons-round text-sm">cancel</span>
                                                                Reject
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* ══════════════════════════════════════════════ */}
                        {/* MY JOBS (IN PROGRESS) SECTION                */}
                        {/* ══════════════════════════════════════════════ */}
                        <div className="flex items-center justify-between mt-10 mb-4">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">My Jobs</h2>
                                {activeJobs.length > 0 && (
                                    <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
                                        {activeJobs.length} active
                                    </span>
                                )}
                            </div>
                        </div>

                        {activeJobs.length > 0 ? (
                            <div className="space-y-4">
                                {activeJobs.map((job) => (
                                    <div key={job._id} className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-md border-l-4 border-l-primary border-y border-r border-slate-200 dark:border-slate-700 overflow-hidden relative group">
                                        <div className="absolute top-4 right-4 bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                                            IN PROGRESS
                                        </div>
                                        <div className="p-6">
                                            <div className="flex flex-col sm:flex-row gap-6">
                                                <div className="flex-shrink-0">
                                                    <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                        <span className="material-icons-round text-4xl text-slate-600 dark:text-slate-300">{getDeviceIcon(job.serviceType)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="mb-4 pr-24">
                                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                                            {job.deviceInfo?.brand && job.deviceInfo?.model
                                                                ? `${job.deviceInfo.brand} ${job.deviceInfo.model}`
                                                                : job.serviceType}
                                                            {job.deviceInfo?.issue ? ` - ${job.deviceInfo.issue}` : ''}
                                                        </h3>
                                                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 flex items-center gap-1">
                                                            <span className="material-icons-round text-sm">schedule</span>
                                                            Started at {formatDate(job.startedAt || job.updatedAt)}
                                                        </p>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                        <div className="flex items-start gap-2">
                                                            <span className="material-icons-round text-slate-400 text-sm mt-0.5">person</span>
                                                            <div>
                                                                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Customer</p>
                                                                <p className="text-sm font-medium">{job.user?.name || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-2">
                                                            <span className="material-icons-round text-slate-400 text-sm mt-0.5">location_on</span>
                                                            <div>
                                                                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Location</p>
                                                                <p className="text-sm font-medium">
                                                                    {job.address
                                                                        ? [job.address.street, job.address.city].filter(Boolean).join(', ')
                                                                        : 'N/A'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {(job.notes || job.description) && (
                                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700 mb-6">
                                                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">CUSTOMER NOTES</p>
                                                            <p className="text-sm text-slate-600 dark:text-slate-300 italic">&quot;{job.notes || job.description}&quot;</p>
                                                        </div>
                                                    )}
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <button
                                                            onClick={() => handleCompleteJob(job._id)}
                                                            disabled={actionLoading === job._id}
                                                            className="bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50"
                                                        >
                                                            <span className="material-icons-round text-sm">check_circle</span>
                                                            {actionLoading === job._id ? 'Updating...' : 'Mark Completed'}
                                                        </button>
                                                        <button className="bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
                                                            Request Parts
                                                        </button>
                                                        <button className="bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ml-auto">
                                                            <span className="material-icons-round">chat</span>
                                                        </button>
                                                        <button className="bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
                                                            <span className="material-icons-round">phone</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
                                <span className="material-icons-round text-4xl text-slate-300 dark:text-slate-600">assignment_turned_in</span>
                                <p className="mt-3 text-slate-500 dark:text-slate-400 font-medium">No active jobs</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Accept an invitation above to start working on a repair</p>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Earnings (Span 1) */}
                    <div className="space-y-6">
                        {/* Earnings Widget */}
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-slate-900 dark:text-white">Earnings Overview</h3>
                                <button className="text-slate-400 hover:text-primary transition-colors">
                                    <span className="material-icons-round">more_horiz</span>
                                </button>
                            </div>
                            <div className="text-center mb-8">
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Total Earnings</p>
                                <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white">
                                    {formatCurrency(earnings?.summary?.totalEarnings)}
                                </h2>
                                {earnings?.summary?.completedBookings > 0 && (
                                    <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold">
                                        <span className="material-icons-round text-xs">trending_up</span>
                                        {earnings.summary.completedBookings} jobs completed
                                    </div>
                                )}
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center">
                                            <span className="material-icons-round text-sm">calendar_view_week</span>
                                        </div>
                                        <span className="text-sm font-medium">Paid Out</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                                        {formatCurrency(earnings?.summary?.paidOut)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                            <span className="material-icons-round text-sm">card_giftcard</span>
                                        </div>
                                        <span className="text-sm font-medium">Bonuses</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                                        {formatCurrency(earnings?.summary?.totalBonus)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                                            <span className="material-icons-round text-sm">pending</span>
                                        </div>
                                        <span className="text-sm font-medium">Pending Payout</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                                        {formatCurrency(earnings?.summary?.pendingPayout)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div >
        </div >
    );
};

export default TechnicianDashboard;
