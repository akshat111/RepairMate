import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

// ═══════════════════════════════════════════════════════
// AUTH CONTEXT
// ═══════════════════════════════════════════════════════
//
// Provides authentication state and actions to the entire
// app tree. Handles login, logout, registration, and
// automatic session restoration on mount.
// ═══════════════════════════════════════════════════════

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ── Restore session on mount ──────────────────────────
    useEffect(() => {
        const restoreSession = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const { data } = await authService.getMe();
                setUser(data.data?.user || null);
            } catch {
                localStorage.removeItem('accessToken');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        restoreSession();
    }, []);

    // ── Login ─────────────────────────────────────────────
    const login = useCallback(async (credentials) => {
        setError(null);
        try {
            const { data } = await authService.login(credentials);
            const accessToken = data.data?.accessToken;
            if (accessToken) {
                localStorage.setItem('accessToken', accessToken);
            }
            setUser(data.data?.user || null);
            return data;
        } catch (err) {
            const message = err.response?.data?.message || 'Login failed';
            setError(message);
            throw err;
        }
    }, []);

    // ── Register ──────────────────────────────────────────
    const register = useCallback(async (userData) => {
        setError(null);
        try {
            const { data } = await authService.register(userData);
            const accessToken = data.data?.accessToken;
            if (accessToken) {
                localStorage.setItem('accessToken', accessToken);
            }
            setUser(data.data?.user || null);
            return data;
        } catch (err) {
            const message = err.response?.data?.message || 'Registration failed';
            setError(message);
            throw err;
        }
    }, []);

    // ── Logout ────────────────────────────────────────────
    const logout = useCallback(async () => {
        try {
            await authService.logout();
        } catch {
            // Silent fail — clear local state regardless
        } finally {
            localStorage.removeItem('accessToken');
            setUser(null);
        }
    }, []);

    const value = {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        setError,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
