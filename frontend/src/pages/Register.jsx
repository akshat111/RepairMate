import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const { register, error, setError } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        try {
            const { confirmPassword, ...userData } = formData;
            await register(userData);
            navigate('/dashboard');
        } catch {
            // Error is set via AuthContext
        }
    };

    return (
        <div className="min-h-screen bg-background-light flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-8">
                <div className="flex items-center gap-2 mb-8">
                    <Link to="/" className="flex items-center gap-2 no-underline">
                        <span className="material-icons text-primary text-2xl">build_circle</span>
                        <span className="font-extrabold text-xl text-slate-900">RepairMate</span>
                    </Link>
                </div>

                <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Create Account</h2>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="John Doe"
                            required
                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            required
                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                        />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-1.5">Phone</label>
                        <input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="9876543210"
                            required
                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Minimum 8 characters"
                            minLength={8}
                            required
                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                        />
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Re-enter password"
                            minLength={8}
                            required
                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/30 transition-all"
                    >
                        Create Account
                    </button>
                </form>

                <p className="text-center text-sm text-slate-500 mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary font-semibold hover:underline">Sign In</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
