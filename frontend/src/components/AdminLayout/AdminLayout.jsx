import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ═══════════════════════════════════════════════════════
// ADMIN NAV CONFIGURATION
// ═══════════════════════════════════════════════════════

const NAV_ITEMS = [
    { label: 'Dashboard', icon: 'dashboard', path: '/admin' },
    { label: 'Bookings', icon: 'receipt_long', path: '/admin/bookings' },
    { label: 'Technicians', icon: 'engineering', path: '/admin/technicians' },
    { label: 'Customers', icon: 'group', path: '/admin/customers' },
    { label: 'Inventory', icon: 'inventory_2', path: '/admin/inventory' },
    { label: 'Revenue', icon: 'account_balance', path: '/admin/revenue' },
    { label: 'Settings', icon: 'settings', path: '/admin/settings' },
];

// ═══════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════

const Sidebar = ({ user, onLogout, currentPath }) => (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-900 h-full">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-700/50">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white">
                <span className="material-icons text-xl">admin_panel_settings</span>
            </div>
            <div>
                <Link to="/admin" className="text-lg font-bold tracking-tight text-white no-underline">RepairMate</Link>
                <p className="text-[10px] font-semibold text-primary tracking-widest uppercase -mt-0.5">Admin Panel</p>
            </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
                const isActive =
                    item.path === '/admin'
                        ? currentPath === '/admin'
                        : currentPath.startsWith(item.path);

                return (
                    <Link
                        key={item.label}
                        to={item.path}
                        className={`flex items-center px-4 py-2.5 text-sm rounded-lg no-underline transition-all duration-200 group ${isActive
                                ? 'font-semibold bg-primary text-white shadow-lg shadow-primary/25'
                                : 'font-medium text-slate-400 hover:bg-slate-800 hover:text-white'
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
        <div className="p-4 border-t border-slate-700/50">
            <div className="flex items-center px-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-indigo-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user?.name || 'Admin'}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
                <button onClick={onLogout} className="text-slate-500 hover:text-red-400 transition-colors ml-2" title="Logout">
                    <span className="material-icons text-lg">logout</span>
                </button>
            </div>
        </div>
    </aside>
);

// ═══════════════════════════════════════════════════════
// TOP BAR (desktop)
// ═══════════════════════════════════════════════════════

const TopBar = ({ currentPath }) => {
    const currentPage = NAV_ITEMS.find((item) =>
        item.path === '/admin'
            ? currentPath === '/admin'
            : currentPath.startsWith(item.path)
    );

    return (
        <header className="hidden lg:flex items-center justify-between bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-10">
            <h1 className="text-xl font-bold text-slate-900">{currentPage?.label || 'Admin'}</h1>
            <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full font-medium">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                    System Online
                </span>
            </div>
        </header>
    );
};

// ═══════════════════════════════════════════════════════
// MOBILE HEADER
// ═══════════════════════════════════════════════════════

const MobileHeader = ({ onToggleMenu }) => (
    <header className="lg:hidden bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                <span className="material-icons text-lg">admin_panel_settings</span>
            </div>
            <div>
                <span className="font-bold text-white text-base">RepairMate</span>
                <p className="text-[9px] font-semibold text-primary tracking-widest uppercase -mt-0.5">Admin</p>
            </div>
        </div>
        <button onClick={onToggleMenu} className="text-slate-300 hover:text-white">
            <span className="material-icons">menu</span>
        </button>
    </header>
);

// ═══════════════════════════════════════════════════════
// MOBILE DRAWER
// ═══════════════════════════════════════════════════════

const MobileDrawer = ({ user, onLogout, currentPath, onClose }) => (
    <div className="fixed inset-0 z-30 lg:hidden">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <aside className="fixed left-0 top-0 bottom-0 w-72 bg-slate-900 shadow-2xl flex flex-col z-40">
            <div className="p-4 flex items-center justify-between border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                        <span className="material-icons text-lg">admin_panel_settings</span>
                    </div>
                    <span className="font-bold text-white">Admin Panel</span>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white">
                    <span className="material-icons">close</span>
                </button>
            </div>
            <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                    const isActive =
                        item.path === '/admin'
                            ? currentPath === '/admin'
                            : currentPath.startsWith(item.path);
                    return (
                        <Link
                            key={item.label}
                            to={item.path}
                            onClick={onClose}
                            className={`flex items-center px-4 py-2.5 text-sm rounded-lg no-underline transition-all ${isActive
                                    ? 'font-semibold bg-primary text-white'
                                    : 'font-medium text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <span className="material-icons mr-3 text-xl">{item.icon}</span>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 border-t border-slate-700/50">
                <div className="flex items-center px-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-indigo-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user?.name || 'Admin'}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <button onClick={onLogout} className="text-slate-500 hover:text-red-400 transition-colors ml-2" title="Logout">
                        <span className="material-icons text-lg">logout</span>
                    </button>
                </div>
            </div>
        </aside>
    </div>
);

// ═══════════════════════════════════════════════════════
// ADMIN LAYOUT
// ═══════════════════════════════════════════════════════

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            <Sidebar user={user} onLogout={handleLogout} currentPath={location.pathname} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <MobileHeader onToggleMenu={() => setMobileMenuOpen(true)} />
                <TopBar currentPath={location.pathname} />

                {mobileMenuOpen && (
                    <MobileDrawer
                        user={user}
                        onLogout={handleLogout}
                        currentPath={location.pathname}
                        onClose={() => setMobileMenuOpen(false)}
                    />
                )}

                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
