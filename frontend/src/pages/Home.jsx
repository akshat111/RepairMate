import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="page home-page">
            <h1>Welcome to RepairMate</h1>
            <p>Your trusted repair service platform.</p>
            <div className="home-actions">
                <Link to="/login" className="btn btn-primary">Sign In</Link>
                <Link to="/register" className="btn btn-secondary">Create Account</Link>
            </div>
        </div>
    );
};

export default Home;
