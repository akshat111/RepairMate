const HeroSection = () => {
    return (
        <section className="relative pt-16 pb-32 lg:pt-24 lg:pb-48 overflow-hidden">
            {/* Abstract Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4"></div>
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
                    {/* Text Content */}
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-sm">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                            Technicians available now
                        </div>

                        <h1 className="text-4xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-slate-900">
                            Fast, Reliable Device <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                                Repair at Your Doorstep
                            </span>
                        </h1>

                        <p className="text-lg text-slate-600 max-w-lg leading-relaxed">
                            Expert technicians come to you. Whether it&apos;s a cracked screen or a faulty battery, get your mobile or laptop fixed in under 60 minutes.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex items-center gap-2 text-slate-500 font-medium">
                                <span className="material-icons text-green-500">check_circle</span> No Fix, No Fee
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 font-medium">
                                <span className="material-icons text-green-500">check_circle</span> 6 Month Warranty
                            </div>
                        </div>
                    </div>

                    {/* Hero Image */}
                    <div className="relative lg:h-[500px] flex items-center justify-center">
                        <div className="relative w-full max-w-md aspect-[4/5] lg:aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-primary/20">
                            <img
                                alt="Technician repairing a smartphone with tools on a desk"
                                className="w-full h-full object-cover"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlk8gY5lpCHQUF8GACo3IhAiNyBHnNNhEz0ENGK1uaXIianA0hzmJXMqwxApU-KABInfibGlLOpbuDEg_WM9UVT9vd9tzpn8MxknWOP4UAm1YCzds37i26kW092u8lZbZZ-FVQEavk9Vl1RhUsJ792p-bwGLtVJFJFwr3qn5FclbXYYY75ytSbR6bes-e8LwdpNMuiWJzPZY8kQ5FSQ1vzjzG_3LO8hoqToolk9Lh_ohKk0Dsfs9JrVnxz_eohk7hZNyBlV9Nz4bfF"
                                loading="eager"
                            />
                            {/* Floating Badge */}
                            <div className="absolute bottom-6 left-6 right-6 bg-white p-4 rounded-xl shadow-lg border border-slate-100 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                    <span className="material-icons text-green-600">verified_user</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">Certified Experts</p>
                                    <p className="text-xs text-slate-500">5000+ Repairs completed</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
