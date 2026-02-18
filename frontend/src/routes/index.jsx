import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import DashboardLayout from '../components/DashboardLayout/DashboardLayout';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Bookings from '../pages/Bookings';
import Profile from '../pages/Profile';
import BookRepair from '../pages/BookRepair';
import TechnicianDashboard from '../pages/TechnicianDashboard';
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
            // Admin pages will go here
        ],
    },

    // ── Protected routes (technician only) ────────────
    {
        element: <ProtectedRoute allowedRoles={['technician', 'admin']} />,
        children: [
            {
                path: '/technician/dashboard',
                element: <TechnicianDashboard />,
            },
            {
                path: '/technician/jobs',
                element: <TechnicianDashboard />,
            },
            {
                path: '/technician/history',
                element: <TechnicianDashboard />,
            },
            {
                path: '/technician/inventory',
                element: <TechnicianDashboard />,
            },
            {
                path: '/technician/earnings',
                element: <TechnicianDashboard />,
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
