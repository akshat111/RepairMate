import { Link } from 'react-router-dom';

const Unauthorized = () => {
    return (
        <div className="page unauthorized-page">
            <h1>403</h1>
            <p>You don&apos;t have permission to access this page.</p>
            <Link to="/" className="btn btn-primary">Go Home</Link>
        </div>
    );
};

export default Unauthorized;
