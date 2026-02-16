import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-background-light">
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-extrabold text-slate-900">Dashboard</h1>
                <button
                    onClick={logout}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-2.5 rounded-xl transition-colors"
                >
                    Logout
                </button>
            </header>
            <div className="max-w-4xl mx-auto px-4 py-10">
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Welcome, {user?.name || 'User'}!</h2>
                    <p className="text-slate-600 mb-2">Role: <strong className="text-slate-900">{user?.role || 'user'}</strong></p>
                    <p className="text-slate-600">Email: {user?.email}</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
