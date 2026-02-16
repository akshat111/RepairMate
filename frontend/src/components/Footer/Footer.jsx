import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-slate-200 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    <div className="col-span-2 md:col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-6 no-underline">
                            <span className="material-icons text-primary text-2xl">build_circle</span>
                            <span className="font-extrabold text-xl text-slate-900">RepairMate</span>
                        </Link>
                        <p className="text-slate-500 text-sm mb-6">
                            Bringing professional device repair to your doorstep. Fast, reliable, and secure.
                        </p>
                        <div className="flex space-x-4">
                            <a className="text-slate-400 hover:text-primary transition-colors" href="#">
                                <i className="material-icons">facebook</i>
                            </a>
                            <a className="text-slate-400 hover:text-primary transition-colors" href="#">
                                <i className="material-icons">alternate_email</i>
                            </a>
                            <a className="text-slate-400 hover:text-primary transition-colors" href="#">
                                <i className="material-icons">camera_alt</i>
                            </a>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 mb-4">Services</h4>
                        <ul className="space-y-3 text-sm text-slate-500 list-none p-0">
                            <li><a className="hover:text-primary no-underline text-slate-500" href="#services">Screen Repair</a></li>
                            <li><a className="hover:text-primary no-underline text-slate-500" href="#services">Battery Replacement</a></li>
                            <li><a className="hover:text-primary no-underline text-slate-500" href="#services">Water Damage</a></li>
                            <li><a className="hover:text-primary no-underline text-slate-500" href="#services">Data Recovery</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 mb-4">Company</h4>
                        <ul className="space-y-3 text-sm text-slate-500 list-none p-0">
                            <li><a className="hover:text-primary no-underline text-slate-500" href="#">About Us</a></li>
                            <li><a className="hover:text-primary no-underline text-slate-500" href="#">Careers</a></li>
                            <li><a className="hover:text-primary no-underline text-slate-500" href="#">Blog</a></li>
                            <li><a className="hover:text-primary no-underline text-slate-500" href="#">Contact</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 mb-4">Contact</h4>
                        <ul className="space-y-3 text-sm text-slate-500 list-none p-0">
                            <li className="flex items-center gap-2">
                                <span className="material-icons text-xs">phone</span> +91 9798880305
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="material-icons text-xs">email</span> kakshat111@gmail.com
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="material-icons text-xs">place</span> Bangalore - Karnataka
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-slate-500">© 2026 RepairMate Inc. All rights reserved.</p>
                    <div className="flex space-x-6 text-sm text-slate-500">
                        <a className="hover:text-slate-800 no-underline text-slate-500" href="#">Privacy Policy</a>
                        <a className="hover:text-slate-800 no-underline text-slate-500" href="#">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
