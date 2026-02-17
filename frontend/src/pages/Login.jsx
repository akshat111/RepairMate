import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ═══════════════════════════════════════════════════════
// CUSTOMER LOGIN PAGE
// ═══════════════════════════════════════════════════════

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [validationErrors, setValidationErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const { login, error, setError } = useAuth();
    const navigate = useNavigate();

    // ── Client-side validation ────────────────────────
    const validate = () => {
        const errors = {};
        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }
        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
        }
        return errors;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Clear field-level error on change
        if (validationErrors[name]) {
            setValidationErrors((prev) => ({ ...prev, [name]: null }));
        }
        if (error) setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Run validation
        const errors = validate();
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }
        setValidationErrors({});

        setIsLoading(true);
        try {
            // Send credentials — backend determines role/permissions
            await login({ email: formData.email, password: formData.password });
            navigate('/dashboard');
        } catch {
            // Error is set via AuthContext
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background-light flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-8">
                {/* Logo */}
                <div className="flex items-center gap-2 mb-8">
                    <Link to="/" className="flex items-center gap-2 no-underline">
                        <span className="material-icons text-primary text-2xl">build_circle</span>
                        <span className="font-extrabold text-xl text-slate-900">RepairMate</span>
                    </Link>
                </div>

                {/* Heading */}
                <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Welcome Back</h2>
                <p className="text-sm text-slate-500 mb-6">Sign in to track your repairs and bookings</p>

                {/* Server Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-start gap-2">
                        <span className="material-icons text-red-500 text-lg mt-0.5 shrink-0">error</span>
                        <span>{error}</span>
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Email
                        </label>
                        <div className="relative">
                            <span className="material-icons absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">mail</span>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                autoComplete="email"
                                className={`w-full bg-slate-50 border text-slate-700 py-3 pl-11 pr-4 rounded-xl focus:outline-none focus:ring-2 transition-colors ${validationErrors.email
                                        ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                                        : 'border-slate-200 focus:ring-primary/20 focus:border-primary'
                                    }`}
                            />
                        </div>
                        {validationErrors.email && (
                            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                                <span className="material-icons text-xs">warning</span>
                                {validationErrors.email}
                            </p>
                        )}
                    </div>

                    {/* Password */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Password
                        </label>
                        <div className="relative">
                            <span className="material-icons absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">lock</span>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                className={`w-full bg-slate-50 border text-slate-700 py-3 pl-11 pr-4 rounded-xl focus:outline-none focus:ring-2 transition-colors ${validationErrors.password
                                        ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                                        : 'border-slate-200 focus:ring-primary/20 focus:border-primary'
                                    }`}
                            />
                        </div>
                        {validationErrors.password && (
                            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                                <span className="material-icons text-xs">warning</span>
                                {validationErrors.password}
                            </p>
                        )}
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Signing In...
                            </>
                        ) : (
                            <>
                                <span className="material-icons text-lg">login</span>
                                Sign In
                            </>
                        )}
                    </button>
                </form>

                {/* Footer */}
                <p className="text-center text-sm text-slate-500 mt-6">
                    Don&apos;t have an account?{' '}
                    <Link to="/register" className="text-primary font-semibold hover:underline">Register</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
