import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';

// ═══════════════════════════════════════════════════════
// PROFILE PAGE (renders inside DashboardLayout)
// ═══════════════════════════════════════════════════════

const Profile = () => {
    const { user, setUser } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [profileData, setProfileData] = useState(null);

    // ── Password change state ─────────────────────────
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordError, setPasswordError] = useState(null);
    const [passwordSuccess, setPasswordSuccess] = useState(null);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const fetchProfile = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data } = await authService.getMe();
            setProfileData(data?.data?.user || data?.data || null);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to load profile');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm((prev) => ({ ...prev, [name]: value }));
        if (passwordError) setPasswordError(null);
        if (passwordSuccess) setPasswordSuccess(null);
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(null);

        if (passwordForm.newPassword.length < 8) {
            setPasswordError('New password must be at least 8 characters');
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        setIsChangingPassword(true);
        try {
            await authService.changePassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            });
            setPasswordSuccess('Password changed successfully');
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setPasswordError(err.response?.data?.message || 'Failed to change password');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const profile = profileData || user;

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
                <p className="text-slate-500 mt-1">View your account details and change your password.</p>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <span className="material-icons text-red-500 mt-0.5">error</span>
                    <div className="flex-1">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                    <button onClick={fetchProfile} className="text-sm font-semibold text-red-700 hover:text-red-900 flex items-center gap-1">
                        <span className="material-icons text-sm">refresh</span> Retry
                    </button>
                </div>
            )}

            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                {isLoading ? (
                    <div className="p-8 animate-pulse space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-slate-200 rounded-full" />
                            <div className="space-y-2">
                                <div className="h-5 bg-slate-200 rounded w-40" />
                                <div className="h-4 bg-slate-200 rounded w-56" />
                            </div>
                        </div>
                        <div className="h-4 bg-slate-200 rounded w-24 mt-6" />
                        <div className="h-4 bg-slate-200 rounded w-32" />
                    </div>
                ) : (
                    <div className="p-8">
                        <div className="flex items-center gap-5 mb-8">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-500 text-white flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
                                {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{profile?.name || 'User'}</h2>
                                <p className="text-sm text-slate-500">{profile?.email}</p>
                                {profile?.role && (
                                    <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                                        {profile.role}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Full Name</p>
                                <p className="text-sm font-medium text-slate-900">{profile?.name || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Email Address</p>
                                <p className="text-sm font-medium text-slate-900">{profile?.email || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Phone</p>
                                <p className="text-sm font-medium text-slate-900">{profile?.phone || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Member Since</p>
                                <p className="text-sm font-medium text-slate-900">
                                    {profile?.createdAt
                                        ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                                        : '—'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-8">
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Change Password</h3>
                    <p className="text-sm text-slate-500 mb-6">Update your account password.</p>

                    {passwordError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2">
                            <span className="material-icons text-red-500 text-lg">error</span>
                            {passwordError}
                        </div>
                    )}
                    {passwordSuccess && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2">
                            <span className="material-icons text-green-500 text-lg">check_circle</span>
                            {passwordSuccess}
                        </div>
                    )}

                    <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                        <div>
                            <label htmlFor="currentPassword" className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Current Password
                            </label>
                            <input
                                id="currentPassword"
                                name="currentPassword"
                                type="password"
                                value={passwordForm.currentPassword}
                                onChange={handlePasswordChange}
                                required
                                className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            />
                        </div>
                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-semibold text-slate-700 mb-1.5">
                                New Password
                            </label>
                            <input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={handlePasswordChange}
                                required
                                minLength={8}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Confirm New Password
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={handlePasswordChange}
                                required
                                minLength={8}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isChangingPassword}
                            className="bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-2.5 px-6 rounded-xl shadow-sm shadow-primary/30 transition-all flex items-center gap-2"
                        >
                            {isChangingPassword ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Updating...
                                </>
                            ) : (
                                'Update Password'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
