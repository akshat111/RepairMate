import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import technicianService from '../services/technicianService';
import authService from '../services/authService';

const SPECIALIZATION_OPTIONS = [
    'Smartphone Repair',
    'Laptop/PC Repair',
    'Tablet Repair',
    'Console Repair',
    'Smartwatch Repair',
    'Micro-soldering',
    'Data Recovery',
    'Screen Replacement',
    'Battery Replacement'
];

const TechnicianRegister = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState(null);

    // Step 1: User Account Data
    const [userData, setUserData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });

    // Step 2: Professional Data
    const [professionalData, setProfessionalData] = useState({
        experienceYears: '',
        hourlyRate: '',
        serviceArea: '',
        specializations: [],
    });

    const { register, logout, error, setError, user, setUser } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        setUserData({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
        setProfessionalData({ experienceYears: '', hourlyRate: '', serviceArea: '', specializations: [] });
        setStep(1);
        setFormError(null);
    };

    const handleUserChange = (e) => {
        setUserData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        if (formError || error) {
            setFormError(null);
            setError(null);
        }
    };

    const handleProfessionalChange = (e) => {
        setProfessionalData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        if (formError) setFormError(null);
    };

    const toggleSpecialization = (spec) => {
        setProfessionalData((prev) => {
            const isSelected = prev.specializations.includes(spec);
            if (isSelected) {
                return { ...prev, specializations: prev.specializations.filter(s => s !== spec) };
            } else {
                return { ...prev, specializations: [...prev.specializations, spec] };
            }
        });
        if (formError) setFormError(null);
    };

    const handleNextStep = (e) => {
        e.preventDefault();
        setFormError(null);

        if (!userData.name || !userData.email || !userData.phone || !userData.password) {
            return setFormError('All fields are required');
        }
        if (userData.password !== userData.confirmPassword) {
            return setFormError('Passwords do not match');
        }
        if (userData.password.length < 8) {
            return setFormError('Password must be at least 8 characters');
        }

        setStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);

        if (professionalData.specializations.length === 0) {
            return setFormError('Please select at least one specialization');
        }
        if (!professionalData.experienceYears || professionalData.experienceYears < 0) {
            return setFormError('Please enter valid experience years');
        }

        setLoading(true);
        try {
            let currentUser = user;
            // If the user isn't logged in, register them first
            if (!currentUser) {
                const { confirmPassword, ...registerPayload } = userData;
                const registerRes = await register(registerPayload);
                // The backend authController.register returns { data: { user: {...} } }
                currentUser = registerRes?.data?.user || registerRes?.user;
            }

            // At this point, they are logged in (via context), create tech profile
            await technicianService.registerTechnician(professionalData);

            // Fetch the updated user profile from backend to get the new 'technician' role
            // We use getMe() to refresh the user from the token API
            const meRes = await authService.getMe();
            if (meRes?.data?.data?.user) {
                // We use setUser from context, so we need to grab it from useAuth
                setUser(meRes.data.data.user);
            }

            // Redirect to dashboard (will show pending state)
            navigate('/technician/dashboard');

        } catch (err) {
            if (err.response?.data?.message) {
                setFormError(err.response.data.message);
            } else if (!error) {
                setFormError('Failed to complete registration. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col md:flex-row">

                {/* Left Sidebar Info */}
                <div className="md:w-1/3 bg-gradient-to-br from-primary to-indigo-600 p-8 text-white flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-10">
                            <Link to="/" className="flex items-center gap-2 text-white text-xl font-bold">
                                <span className="material-icons text-2xl">build_circle</span>
                                RepairMate
                            </Link>

                            {/* Show logout button if user is already authenticated */}
                            {user && (
                                <button
                                    onClick={handleLogout}
                                    type="button"
                                    className="text-xs font-semibold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                    title="Sign out of current account"
                                >
                                    <span className="material-icons text-sm">logout</span>
                                    Logout
                                </button>
                            )}
                        </div>
                        <h2 className="text-2xl font-bold mb-4 leading-tight">Join Our Network</h2>
                        <ul className="space-y-4 text-primary-50 text-sm">
                            <li className="flex gap-3">
                                <span className="material-icons text-white text-base mt-0.5">payments</span>
                                Accept high-paying jobs in your area
                            </li>
                            <li className="flex gap-3">
                                <span className="material-icons text-white text-base mt-0.5">schedule</span>
                                Work on your own schedule
                            </li>
                            <li className="flex gap-3">
                                <span className="material-icons text-white text-base mt-0.5">query_stats</span>
                                Track your earnings and performance
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Right Form Area */}
                <div className="md:w-2/3 p-8">
                    {/* Stepper Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${step >= 1 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>1</div>
                        <div className={`h-1 flex-1 rounded ${step === 2 ? 'bg-primary' : 'bg-slate-100'}`}></div>
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${step === 2 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>2</div>
                    </div>

                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                        {step === 1 ? 'Account Details' : 'Professional Profile'}
                    </h2>
                    <p className="text-slate-500 text-sm mb-6">
                        {step === 1 ? "First, let's create your account credentials." : "Tell us about your skills and experience."}
                    </p>

                    {(formError || error) && (
                        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-6 border border-red-200">
                            {formError || error}
                        </div>
                    )}

                    {step === 1 ? (
                        <form onSubmit={handleNextStep} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                                    <input type="text" name="name" value={userData.name} onChange={handleUserChange} required className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                                    <input type="email" name="email" value={userData.email} onChange={handleUserChange} required className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Phone</label>
                                    <input type="tel" name="phone" value={userData.phone} onChange={handleUserChange} required className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                                    <input type="password" name="password" value={userData.password} onChange={handleUserChange} required minLength={8} className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Confirm</label>
                                    <input type="password" name="confirmPassword" value={userData.confirmPassword} onChange={handleUserChange} required minLength={8} className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                                </div>
                            </div>
                            <button type="submit" className="w-full py-3 bg-primary text-white rounded-lg font-bold mt-6 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                                Continue <span className="material-icons text-sm">arrow_forward</span>
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Specializations <span className="text-red-500">*</span></label>
                                <div className="flex flex-wrap gap-2">
                                    {SPECIALIZATION_OPTIONS.map(spec => (
                                        <button
                                            key={spec}
                                            type="button"
                                            onClick={() => toggleSpecialization(spec)}
                                            className={`px-3 py-1.5 rounded-full text-sm border font-medium transition-colors ${professionalData.specializations.includes(spec)
                                                ? 'bg-primary text-white border-primary'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            {spec}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Years of Experience <span className="text-red-500">*</span></label>
                                    <input type="number" name="experienceYears" value={professionalData.experienceYears} onChange={handleProfessionalChange} min="0" required className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="e.g. 5" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Hourly Rate (₹)</label>
                                    <input type="number" name="hourlyRate" value={professionalData.hourlyRate} onChange={handleProfessionalChange} min="0" className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="e.g. 500" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Service Area (City/Neighborhood)</label>
                                    <input type="text" name="serviceArea" value={professionalData.serviceArea} onChange={handleProfessionalChange} className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="e.g. Downtown Mumbai" />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setStep(1)} className="px-5 py-3 rounded-lg font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                                    Back
                                </button>
                                <button type="submit" disabled={loading} className="flex-1 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                                    {loading ? 'Submitting...' : 'Submit Application'}
                                    {!loading && <span className="material-icons text-sm">check_circle</span>}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TechnicianRegister;
