import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import technicianService from '../../services/technicianService';

// ═══════════════════════════════════════════════════════
// TECHNICIAN NAV CONFIGURATION
// ═══════════════════════════════════════════════════════

const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/technician/dashboard' },
    { id: 'jobs', label: 'My Jobs', icon: 'assignment', path: '/technician/jobs' },
    { id: 'history', label: 'Job History', icon: 'history', path: '/technician/history' },
    { id: 'inventory', label: 'Parts Inventory', icon: 'inventory_2', path: '/technician/inventory' },
    { id: 'earnings', label: 'Earnings', icon: 'payments', path: '/technician/earnings' },
];

// ═══════════════════════════════════════════════════════
// SIDEBAR (Desktop)
// ═══════════════════════════════════════════════════════

const Sidebar = ({ currentPath, assignedJobsCount }) => (
    <aside className="w-64 bg-surface-light dark:bg-surface-dark border-r border-slate-200 dark:border-slate-800 hidden lg:flex flex-col justify-between p-4">
        <nav className="space-y-2">
            {NAV_ITEMS.map((item) => {
                const isActive = item.path === '/technician/dashboard'
                    ? currentPath === '/technician/dashboard'
                    : currentPath.startsWith(item.path);

                return (
                    <Link
                        key={item.id}
                        to={item.path}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-left no-underline ${isActive
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                    >
                        <span className="material-icons-round">{item.icon}</span>
                        {item.label}
                        {item.id === 'jobs' && assignedJobsCount > 0 && (
                            <span className="ml-auto bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">{assignedJobsCount}</span>
                        )}
                    </Link>
                );
            })}
        </nav>
    </aside>
);

// ═══════════════════════════════════════════════════════
// MOBILE DRAWER
// ═══════════════════════════════════════════════════════

const MobileDrawer = ({ currentPath, assignedJobsCount, onClose }) => (
    <div className="fixed inset-0 z-40 lg:hidden">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <aside className="fixed left-0 top-0 bottom-0 w-72 bg-surface-light dark:bg-surface-dark border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-50">
            <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                        <span className="material-icons-round text-lg">build</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">RepairMate Tech</span>
                </div>
                <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:hover:text-white">
                    <span className="material-icons-round">close</span>
                </button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                    const isActive = item.path === '/technician/dashboard'
                        ? currentPath === '/technician/dashboard'
                        : currentPath.startsWith(item.path);
                    return (
                        <Link
                            key={item.id}
                            to={item.path}
                            onClick={onClose}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors no-underline ${isActive
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            <span className="material-icons-round">{item.icon}</span>
                            {item.label}
                            {item.id === 'jobs' && assignedJobsCount > 0 && (
                                <span className="ml-auto bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">{assignedJobsCount}</span>
                            )}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    </div>
);

// ═══════════════════════════════════════════════════════
// TOP HEADER
// ═══════════════════════════════════════════════════════

const TopHeader = ({ user, isOnline, onToggleOnline, onLogout, onToggleMenu }) => (
    <header className="bg-surface-light dark:bg-surface-dark border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 h-16 flex items-center justify-between px-4 lg:px-6 shadow-sm">
        <div className="flex items-center gap-4">
            <button
                onClick={onToggleMenu}
                className="lg:hidden text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
                <span className="material-icons-round">menu</span>
            </button>
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                    <span className="material-icons-round text-xl">build</span>
                </div>
                <Link to="/" className="no-underline hidden sm:block">
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Repair<span className="text-primary">Mate</span></h1>
                </Link>
            </div>
        </div>
        <div className="flex items-center gap-4 lg:gap-6">
            {/* Global Status Toggle */}
            <div className="flex items-center gap-2 lg:gap-3 bg-slate-100 dark:bg-slate-800 px-3 lg:px-4 py-1.5 lg:py-2 rounded-full border border-slate-200 dark:border-slate-700">
                <span className="text-xs lg:text-sm font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">Status:</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        checked={isOnline}
                        onChange={onToggleOnline}
                        className="sr-only peer"
                        type="checkbox"
                    />
                    <div className="w-9 lg:w-11 h-5 lg:h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 lg:after:h-5 after:w-4 lg:after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={onLogout} title="Logout">
                <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center text-primary font-bold text-xs lg:text-sm">
                    {user?.name?.charAt(0)?.toUpperCase() || 'T'}
                </div>
                <div className="hidden lg:block leading-tight">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.name || 'Technician'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Technician</p>
                </div>
            </div>
        </div>
    </header>
);

// ═══════════════════════════════════════════════════════
// TECHNICIAN LAYOUT MAIN
// ═══════════════════════════════════════════════════════

const TechnicianLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [isOnline, setIsOnline] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [assignedJobsCount, setAssignedJobsCount] = useState(0);
    const [profile, setProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [noProfile, setNoProfile] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoadingProfile(true);
                // 1. Fetch Profile
                const profileRes = await technicianService.getMyProfile();
                const currentProfile = profileRes.data?.data?.technician;
                setProfile(currentProfile);

                // 2. Fetch Jobs count IF profile is fully approved so we can show sidebar count
                if (currentProfile?.verificationStatus === 'approved') {
                    const jobsRes = await technicianService.getAssignedBookings();
                    const allBookings = jobsRes.data?.data?.bookings || [];
                    const activeCount = allBookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled').length;
                    setAssignedJobsCount(activeCount);
                }
            } catch (err) {
                if (err.response?.status === 404) {
                    setNoProfile(true);
                }
            } finally {
                setLoadingProfile(false);
            }
        };

        fetchInitialData();
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // ── Pre-render checks ───────────────────────────────
    if (loadingProfile) {
        return (
            <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <span className="material-icons-round text-5xl text-primary animate-spin">refresh</span>
                    <p className="mt-4 text-slate-500 font-medium">Checking technician profile...</p>
                </div>
            </div>
        );
    }

    if (noProfile) {
        return (
            <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md p-6">
                    <div className="w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-6">
                        <span className="material-icons-round text-4xl text-orange-500">engineering</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Technician Profile Not Found</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">
                        Your account has the technician role, but no profile was created. Please re-register or contact support.
                    </p>
                    <button onClick={() => navigate('/')} className="bg-primary hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold">
                        Go to Home
                    </button>
                </div>
            </div>
        );
    }

    const isPending = profile?.verificationStatus === 'pending';
    const isRejected = profile?.verificationStatus === 'rejected';

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-800 dark:text-slate-100 h-screen flex flex-col antialiased">
            {/* Navbar */}
            <TopHeader
                user={user}
                isOnline={isOnline}
                onToggleOnline={() => setIsOnline(!isOnline)}
                onLogout={handleLogout}
                onToggleMenu={() => setMobileMenuOpen(true)}
            />

            <div className="flex flex-1 overflow-hidden">
                {/* Desktop Sidebar */}
                <Sidebar
                    currentPath={location.pathname}
                    assignedJobsCount={assignedJobsCount}
                />

                {/* Mobile Drawer */}
                {mobileMenuOpen && (
                    <MobileDrawer
                        currentPath={location.pathname}
                        assignedJobsCount={assignedJobsCount}
                        onClose={() => setMobileMenuOpen(false)}
                    />
                )}

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8 relative">
                    {/* Verification Status Banner (Always spans top if not approved) */}
                    {(isPending || isRejected) && (
                        <div className="mb-6">
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

                    {/* Inject Current Tab via React Router */}
                    {/* We pass down context so child routes can trigger reload if needed */}
                    <Outlet context={{ isPending, isRejected }} />
                </main>
            </div>
        </div>
    );
};

export default TechnicianLayout;
