import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="page not-found-page">
            <h1>404</h1>
            <p>The page you&apos;re looking for doesn&apos;t exist.</p>
            <Link to="/" className="btn btn-primary">Go Home</Link>
        </div>
    );
};

export default NotFound;
