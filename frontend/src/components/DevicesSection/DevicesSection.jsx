import { Link } from 'react-router-dom';

const DevicesSection = () => {
    return (
        <section className="py-20 bg-slate-50" id="services">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                    <div>
                        <span className="text-primary font-bold tracking-wider uppercase text-sm">Our Expertise</span>
                        <h2 className="text-3xl md:text-4xl font-extrabold mt-2 text-slate-900">Devices We Repair</h2>
                    </div>
                    <Link to="/register" className="text-primary font-bold flex items-center gap-1 hover:gap-2 transition-all no-underline">
                        View full price list <span className="material-icons text-sm">arrow_forward</span>
                    </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {/* Card 1 */}
                    <div className="bg-white p-6 rounded-xl border border-slate-100 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                            <span className="material-icons text-primary">phone_iphone</span>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 mb-1">iPhone Repair</h3>
                        <p className="text-sm text-slate-500">Screens, Batteries &amp; more</p>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-white p-6 rounded-xl border border-slate-100 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                        <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-4">
                            <span className="material-icons text-green-600">android</span>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 mb-1">Android Repair</h3>
                        <p className="text-sm text-slate-500">Samsung, Pixel, OnePlus</p>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-white p-6 rounded-xl border border-slate-100 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                        <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mb-4">
                            <span className="material-icons text-slate-600">laptop_mac</span>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 mb-1">MacBook Repair</h3>
                        <p className="text-sm text-slate-500">Pro, Air, &amp; iMac models</p>
                    </div>

                    {/* Card 4 */}
                    <div className="bg-white p-6 rounded-xl border border-slate-100 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                        <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mb-4">
                            <span className="material-icons text-purple-600">computer</span>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 mb-1">Windows Laptops</h3>
                        <p className="text-sm text-slate-500">Dell, HP, Lenovo, Asus</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default DevicesSection;
