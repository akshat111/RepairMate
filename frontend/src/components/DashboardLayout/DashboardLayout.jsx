import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ═══════════════════════════════════════════════════════
// NAV CONFIGURATION
// ═══════════════════════════════════════════════════════

const NAV_ITEMS = [
    { label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { label: 'Bookings', icon: 'receipt_long', path: '/dashboard/bookings' },
    { label: 'Profile', icon: 'person', path: '/dashboard/profile' },
];

// ═══════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════

const Sidebar = ({ user, onLogout, currentPath }) => (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 h-full">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white">
                <span className="material-icons text-xl">build</span>
            </div>
            <Link to="/" className="text-xl font-bold tracking-tight text-slate-900 no-underline">RepairMate</Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
            {NAV_ITEMS.map((item) => {
                const isActive =
                    item.path === '/dashboard'
                        ? currentPath === '/dashboard'
                        : currentPath.startsWith(item.path);

                return (
                    <Link
                        key={item.label}
                        to={item.path}
                        className={`flex items-center px-4 py-3 text-sm rounded-lg no-underline transition-colors group ${isActive
                                ? 'font-semibold bg-primary/10 text-primary'
                                : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                    >
                        <span className={`material-icons mr-3 text-xl ${!isActive ? 'group-hover:text-primary transition-colors' : ''}`}>
                            {item.icon}
                        </span>
                        {item.label}
                    </Link>
                );
            })}
        </nav>

        {/* User footer */}
        <div className="p-4 mt-auto">
            <div className="flex items-center px-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{user?.name || 'User'}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
                <button onClick={onLogout} className="text-slate-400 hover:text-red-500 transition-colors ml-2" title="Logout">
                    <span className="material-icons text-lg">logout</span>
                </button>
            </div>
        </div>
    </aside>
);

// ═══════════════════════════════════════════════════════
// MOBILE HEADER
// ═══════════════════════════════════════════════════════

const MobileHeader = ({ onToggleMenu }) => (
    <header className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-20">
        <Link to="/" className="flex items-center gap-2 no-underline">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white">
                <span className="material-icons text-lg">build</span>
            </div>
            <span className="font-bold text-lg text-slate-900">RepairMate</span>
        </Link>
        <button onClick={onToggleMenu} className="text-slate-500 hover:text-slate-700">
            <span className="material-icons">menu</span>
        </button>
    </header>
);

// ═══════════════════════════════════════════════════════
// MOBILE DRAWER (shown when menu toggled)
// ═══════════════════════════════════════════════════════

const MobileDrawer = ({ user, onLogout, currentPath, onClose }) => (
    <div className="fixed inset-0 z-30 lg:hidden">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/40" onClick={onClose} />
        {/* Drawer */}
        <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-xl flex flex-col z-40 animate-slide-in">
            <div className="p-4 flex items-center justify-between border-b border-slate-200">
                <Link to="/" className="flex items-center gap-2 no-underline" onClick={onClose}>
                    <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white">
                        <span className="material-icons text-lg">build</span>
                    </div>
                    <span className="font-bold text-lg text-slate-900">RepairMate</span>
                </Link>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
                    <span className="material-icons">close</span>
                </button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-1">
                {NAV_ITEMS.map((item) => {
                    const isActive =
                        item.path === '/dashboard'
                            ? currentPath === '/dashboard'
                            : currentPath.startsWith(item.path);
                    return (
                        <Link
                            key={item.label}
                            to={item.path}
                            onClick={onClose}
                            className={`flex items-center px-4 py-3 text-sm rounded-lg no-underline transition-colors ${isActive
                                    ? 'font-semibold bg-primary/10 text-primary'
                                    : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <span className="material-icons mr-3 text-xl">{item.icon}</span>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 border-t border-slate-200">
                <div className="flex items-center px-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{user?.name || 'User'}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <button onClick={onLogout} className="text-slate-400 hover:text-red-500 transition-colors ml-2" title="Logout">
                        <span className="material-icons text-lg">logout</span>
                    </button>
                </div>
            </div>
        </aside>
    </div>
);

// ═══════════════════════════════════════════════════════
// DASHBOARD LAYOUT (wraps all /dashboard/* pages)
// ═══════════════════════════════════════════════════════

const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background-light">
            <Sidebar user={user} onLogout={handleLogout} currentPath={location.pathname} />

            <main className="flex-1 overflow-y-auto">
                <MobileHeader onToggleMenu={() => setMobileMenuOpen(true)} />
                {mobileMenuOpen && (
                    <MobileDrawer
                        user={user}
                        onLogout={handleLogout}
                        currentPath={location.pathname}
                        onClose={() => setMobileMenuOpen(false)}
                    />
                )}

                {/* Child page content renders here */}
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout;
