import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const { user, logout } = useAuth();

    return (
        <div className="page dashboard-page">
            <header className="dashboard-header">
                <h1>Dashboard</h1>
                <button onClick={logout} className="btn btn-outline">
                    Logout
                </button>
            </header>
            <div className="dashboard-content">
                <div className="welcome-card">
                    <h2>Welcome, {user?.name || 'User'}!</h2>
                    <p>Role: <strong>{user?.role || 'user'}</strong></p>
                    <p>Email: {user?.email}</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
