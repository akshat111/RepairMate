import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
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
                element: <Dashboard />,
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
            // Technician pages will go here
        ],
    },

    // ── Catch-all ─────────────────────────────────────
    {
        path: '*',
        element: <NotFound />,
    },
]);

export default router;
