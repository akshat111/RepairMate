import { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    return (
        <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <Link to="/" onClick={closeMenu} className="flex-shrink-0 flex items-center gap-2 cursor-pointer no-underline">
                        <span className="material-icons text-primary text-3xl">build_circle</span>
                        <span className="font-extrabold text-2xl tracking-tight text-slate-900">RepairMate</span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex space-x-8 items-center">
                        <a className="text-slate-600 hover:text-primary font-medium transition-colors no-underline" href="/#services">Services</a>
                        <a className="text-slate-600 hover:text-primary font-medium transition-colors no-underline" href="/#how-it-works">How it Works</a>
                        <a className="text-slate-600 hover:text-primary font-medium transition-colors no-underline" href="/#reviews">Reviews</a>
                        <Link to="/login" className="text-slate-700 hover:text-primary font-semibold transition-colors no-underline flex items-center gap-1.5">
                            <span className="material-icons text-lg">login</span>
                            Sign In
                        </Link>
                        <Link to="/register" className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-lg shadow-primary/20 no-underline">
                            Book Repair
                        </Link>
                    </div>

                    {/* Mobile Hamburger Button */}
                    <div className="md:hidden flex items-center">
                        <button onClick={toggleMenu} className="text-slate-600 hover:text-primary p-2 focus:outline-none">
                            <span className="material-icons text-3xl">{isMenuOpen ? 'close' : 'menu'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            <div className={`md:hidden absolute top-20 left-0 w-full bg-white shadow-xl border-b border-slate-200 transition-all duration-300 ease-in-out origin-top ${isMenuOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'}`}>
                <div className="px-4 pt-2 pb-6 space-y-2 flex flex-col">
                    <a onClick={closeMenu} className="block px-4 py-3 text-slate-700 font-medium hover:bg-slate-50 hover:text-primary rounded-lg no-underline" href="/#services">Services</a>
                    <a onClick={closeMenu} className="block px-4 py-3 text-slate-700 font-medium hover:bg-slate-50 hover:text-primary rounded-lg no-underline" href="/#how-it-works">How it Works</a>
                    <a onClick={closeMenu} className="block px-4 py-3 text-slate-700 font-medium hover:bg-slate-50 hover:text-primary rounded-lg no-underline" href="/#reviews">Reviews</a>
                    <div className="h-px bg-slate-100 my-2 mx-4"></div>
                    <Link onClick={closeMenu} to="/login" className="flex items-center gap-2 px-4 py-3 text-slate-700 font-semibold hover:bg-slate-50 hover:text-primary rounded-lg no-underline">
                        <span className="material-icons text-lg">login</span>
                        Sign In
                    </Link>
                    <div className="px-4 mt-2">
                        <Link onClick={closeMenu} to="/register" className="block text-center w-full bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-primary/20 no-underline">
                            Book Repair
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
