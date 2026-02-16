import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <Link to="/" className="flex-shrink-0 flex items-center gap-2 cursor-pointer no-underline">
                        <span className="material-icons text-primary text-3xl">build_circle</span>
                        <span className="font-extrabold text-2xl tracking-tight text-slate-900">RepairMate</span>
                    </Link>

                    <div className="hidden md:flex space-x-8 items-center">
                        <a className="text-slate-600 hover:text-primary font-medium transition-colors no-underline" href="#services">Services</a>
                        <a className="text-slate-600 hover:text-primary font-medium transition-colors no-underline" href="#how-it-works">How it Works</a>
                        <a className="text-slate-600 hover:text-primary font-medium transition-colors no-underline" href="#reviews">Reviews</a>
                        <Link to="/register" className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-lg shadow-primary/20 no-underline">
                            Book Repair
                        </Link>
                    </div>

                    <div className="md:hidden flex items-center">
                        <button className="text-slate-600 hover:text-primary">
                            <span className="material-icons text-3xl">menu</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
