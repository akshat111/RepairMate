import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="min-h-screen bg-background-light flex flex-col items-center justify-center px-4 text-center">
            <h1 className="text-8xl font-extrabold text-primary mb-4">404</h1>
            <p className="text-lg text-slate-600 mb-8">The page you&apos;re looking for doesn&apos;t exist.</p>
            <Link
                to="/"
                className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-primary/30 transition-all no-underline"
            >
                Go Home
            </Link>
        </div>
    );
};

export default NotFound;
