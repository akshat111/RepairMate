const TrustSection = () => {
    return (
        <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl h-[400px]">
                        <img
                            alt="Close up of electronic circuit board repair"
                            className="w-full h-full object-cover"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhsJGYdpYEhKEFL-lcoAIfwruNNOZ57Pn9RQDKoz8Fyju-Q2FFvmdK0GQ-O2lPZwVj0ecuKEZlOtULmMWJKGQXkd7OgF49GB0YDKbd2Qa-EOSVmD64E6ko8aO8HJkViDbAHevcMf5YQHtmZsbr2xRmSYl2Zz-T73NSkTivSX2mSIa0eYK6YxDSGe2wzRwvexmIEDt_j__sQvfO-BMSCudMuWGR9zkGZIyh1qDqnnOOXkBzCd8exXxuGEdx4A-1hXtkqHt-5uoBZ6g8"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-primary/10"></div>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <span className="text-primary font-bold tracking-wider uppercase text-sm">Why Choose Us</span>
                            <h2 className="text-3xl md:text-4xl font-extrabold mt-2 mb-6 text-slate-900">Trust &amp; Transparency at Core</h2>
                            <p className="text-slate-600 text-lg">We believe repair should be seamless. No hidden costs, no long waits, just quality service at your convenience.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                    <span className="material-icons text-primary">verified</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-slate-900">Certified Technicians</h4>
                                    <p className="text-slate-500">Background checked experts with over 5 years of experience.</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                    <span className="material-icons text-primary">history</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-slate-900">6 Months Warranty</h4>
                                    <p className="text-slate-500">We stand by our parts and service. If it fails, we fix it for free.</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                    <span className="material-icons text-primary">price_check</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-slate-900">Upfront Pricing</h4>
                                    <p className="text-slate-500">Get a quote before booking. No hidden fees or surprises.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TrustSection;
