import { Link } from 'react-router-dom';

const CTASection = () => {
    return (
        <section className="py-20 bg-background-light">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-primary rounded-3xl p-12 text-center relative overflow-hidden shadow-2xl shadow-primary/30">
                    {/* Abstract Circles */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl -translate-x-1/2 translate-y-1/2"></div>

                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">Ready to fix your device?</h2>
                        <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
                            Don&apos;t let a broken screen slow you down. Book a certified technician to your door in minutes.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link to="/register" className="bg-white text-primary hover:bg-slate-100 font-bold py-4 px-8 rounded-xl shadow-lg transition-colors no-underline">
                                Book Repair Now
                            </Link>
                            <Link to="/register" className="bg-primary border border-white/30 hover:bg-white/10 text-white font-bold py-4 px-8 rounded-xl transition-colors no-underline">
                                Check Prices
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CTASection;
