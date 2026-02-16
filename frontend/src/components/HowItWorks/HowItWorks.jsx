const HowItWorks = () => {
    return (
        <section className="py-20 bg-white" id="how-it-works">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <span className="text-primary font-bold tracking-wider uppercase text-sm">Process</span>
                    <h2 className="text-3xl md:text-4xl font-extrabold mt-2 mb-4 text-slate-900">How RepairMate Works</h2>
                    <p className="text-slate-600">Simple, transparent, and hassle-free. Get your device back to life in 3 easy steps.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-100 z-0"></div>

                    {/* Step 1 */}
                    <div className="relative z-10 flex flex-col items-center text-center group">
                        <div className="w-24 h-24 rounded-2xl bg-white border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center justify-center mb-6 group-hover:-translate-y-2 transition-transform duration-300">
                            <span className="material-icons text-4xl text-primary">touch_app</span>
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-900">1. Book Online</h3>
                        <p className="text-slate-500 px-4">Select your device, describe the issue, and pick a convenient time slot.</p>
                    </div>

                    {/* Step 2 */}
                    <div className="relative z-10 flex flex-col items-center text-center group">
                        <div className="w-24 h-24 rounded-2xl bg-white border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center justify-center mb-6 group-hover:-translate-y-2 transition-transform duration-300">
                            <span className="material-icons text-4xl text-primary">local_shipping</span>
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-900">2. Technician Arrives</h3>
                        <p className="text-slate-500 px-4">Our certified expert comes to your doorstep fully equipped to fix the issue.</p>
                    </div>

                    {/* Step 3 */}
                    <div className="relative z-10 flex flex-col items-center text-center group">
                        <div className="w-24 h-24 rounded-2xl bg-white border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center justify-center mb-6 group-hover:-translate-y-2 transition-transform duration-300">
                            <span className="material-icons text-4xl text-primary">sentiment_satisfied_alt</span>
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-900">3. Relax &amp; Pay</h3>
                        <p className="text-slate-500 px-4">Watch your device get fixed. Pay securely only after you are satisfied.</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
