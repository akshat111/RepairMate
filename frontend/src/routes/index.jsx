import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import DashboardLayout from '../components/DashboardLayout/DashboardLayout';
import AdminLayout from '../components/AdminLayout/AdminLayout';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import TechnicianRegister from '../pages/TechnicianRegister';
import Dashboard from '../pages/Dashboard';
import Bookings from '../pages/Bookings';
import Profile from '../pages/Profile';
import BookRepair from '../pages/BookRepair';
import TechnicianDashboard from '../pages/TechnicianDashboard';
import TechnicianLayout from '../components/TechnicianLayout/TechnicianLayout';
import TechnicianJobs from '../pages/technician/TechnicianJobs';
import TechnicianHistory from '../pages/technician/TechnicianHistory';
import TechnicianInventory from '../pages/technician/TechnicianInventory';
import TechnicianEarnings from '../pages/technician/TechnicianEarnings';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminBookings from '../pages/admin/AdminBookings';
import AdminTechnicians from '../pages/admin/AdminTechnicians';
import AdminCustomers from '../pages/admin/AdminCustomers';
import AdminInventory from '../pages/admin/AdminInventory';
import AdminRevenue from '../pages/admin/AdminRevenue';
import AdminSettings from '../pages/admin/AdminSettings';
import NotFound from '../pages/NotFound';
import Unauthorized from '../pages/Unauthorized';

// ═══════════════════════════════════════════════════════
// APPLICATION ROUTES
// ═══════════════════════════════════════════════════════

const router = createBrowserRouter([
    // ── Public routes ─────────────────────────────────
    {
        path: '/',
        element: <Home />,
    },
    {
        path: '/login',
        element: <Login />,
    },
    {
        path: '/register',
        element: <Register />,
    },
    {
        path: '/register/technician',
        element: <TechnicianRegister />,
    },
    {
        path: '/unauthorized',
        element: <Unauthorized />,
    },

    // ── Protected routes (any authenticated user) ─────
    {
        element: <ProtectedRoute />,
        children: [
            {
                path: '/dashboard',
                element: <DashboardLayout />,
                children: [
                    {
                        index: true,
                        element: <Dashboard />,
                    },
                    {
                        path: 'bookings',
                        element: <Bookings />,
                    },
                    {
                        path: 'profile',
                        element: <Profile />,
                    },
                ],
            },
            {
                path: '/book-repair',
                element: <BookRepair />,
            },
        ],
    },

    // ── Protected routes (admin only) ─────────────────
    {
        element: <ProtectedRoute allowedRoles={['admin']} />,
        children: [
            {
                path: '/admin',
                element: <AdminLayout />,
                children: [
                    { index: true, element: <AdminDashboard /> },
                    { path: 'bookings', element: <AdminBookings /> },
                    { path: 'technicians', element: <AdminTechnicians /> },
                    { path: 'customers', element: <AdminCustomers /> },
                    { path: 'inventory', element: <AdminInventory /> },
                    { path: 'revenue', element: <AdminRevenue /> },
                    { path: 'settings', element: <AdminSettings /> },
                ],
            },
        ],
    },

    // ── Protected routes (technician only) ────────────
    {
        element: <ProtectedRoute allowedRoles={['technician', 'admin']} />,
        children: [
            {
                path: '/technician',
                element: <TechnicianLayout />,
                children: [
                    { path: 'dashboard', element: <TechnicianDashboard /> },
                    { path: 'jobs', element: <TechnicianJobs /> },
                    { path: 'history', element: <TechnicianHistory /> },
                    { path: 'inventory', element: <TechnicianInventory /> },
                    { path: 'earnings', element: <TechnicianEarnings /> },
                ],
            },
        ],
    },

    // ── Catch-all ─────────────────────────────────────
    {
        path: '*',
        element: <NotFound />,
    },
]);

export default router;
