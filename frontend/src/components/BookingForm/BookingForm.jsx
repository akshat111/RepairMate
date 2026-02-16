import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BRANDS = {
    mobile: ['Apple', 'Samsung', 'Google Pixel', 'OnePlus', 'Xiaomi', 'Other'],
    laptop: ['Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Other'],
    tablet: ['Apple', 'Samsung', 'Lenovo', 'Microsoft', 'Other'],
};

const ISSUES = [
    'Screen Replacement',
    'Battery Replacement',
    'Charging Port Issue',
    'Water Damage',
    'Software Issue',
];

const BookingForm = () => {
    const [device, setDevice] = useState('mobile');
    const [brand, setBrand] = useState('Apple');
    const [issue, setIssue] = useState('Screen Replacement');
    const navigate = useNavigate();

    const handleSubmit = () => {
        const params = new URLSearchParams({ device, brand, issue });
        navigate(`/register?${params.toString()}`);
    };

    return (
        <div className="relative z-20 -mt-20 px-4 mb-24">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 lg:p-10">
                <h3 className="text-xl font-bold mb-6 text-slate-900 flex items-center gap-2">
                    <span className="material-icons text-primary">build</span>
                    Book Your Repair Instantly
                </h3>

                <form className="grid md:grid-cols-12 gap-6" onSubmit={(e) => e.preventDefault()}>
                    {/* Device Type */}
                    <div className="md:col-span-4 space-y-3">
                        <label className="block text-sm font-semibold text-slate-700">Select Device</label>
                        <div className="grid grid-cols-3 gap-3">
                            <label className="cursor-pointer group">
                                <input
                                    className="peer sr-only"
                                    name="device_type"
                                    type="radio"
                                    value="mobile"
                                    checked={device === 'mobile'}
                                    onChange={() => { setDevice('mobile'); setBrand('Apple'); }}
                                />
                                <div className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-slate-200 bg-slate-50 peer-checked:border-primary peer-checked:bg-primary/5 transition-all group-hover:border-primary/50">
                                    <span className="material-icons text-slate-400 peer-checked:text-primary mb-1">smartphone</span>
                                    <span className="text-sm font-medium text-slate-600 peer-checked:text-primary">Mobile</span>
                                </div>
                            </label>
                            <label className="cursor-pointer group">
                                <input
                                    className="peer sr-only"
                                    name="device_type"
                                    type="radio"
                                    value="laptop"
                                    checked={device === 'laptop'}
                                    onChange={() => { setDevice('laptop'); setBrand('Apple'); }}
                                />
                                <div className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-slate-200 bg-slate-50 peer-checked:border-primary peer-checked:bg-primary/5 transition-all group-hover:border-primary/50">
                                    <span className="material-icons text-slate-400 peer-checked:text-primary mb-1">laptop_mac</span>
                                    <span className="text-sm font-medium text-slate-600 peer-checked:text-primary">Laptop</span>
                                </div>
                            </label>
                            <label className="cursor-pointer group">
                                <input
                                    className="peer sr-only"
                                    name="device_type"
                                    type="radio"
                                    value="tablet"
                                    checked={device === 'tablet'}
                                    onChange={() => { setDevice('tablet'); setBrand('Apple'); }}
                                />
                                <div className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-slate-200 bg-slate-50 peer-checked:border-primary peer-checked:bg-primary/5 transition-all group-hover:border-primary/50">
                                    <span className="material-icons text-slate-400 peer-checked:text-primary mb-1">tablet_mac</span>
                                    <span className="text-sm font-medium text-slate-600 peer-checked:text-primary">Tablet</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Brand Select */}
                    <div className="md:col-span-4 space-y-3">
                        <label className="block text-sm font-semibold text-slate-700">Select Brand</label>
                        <div className="relative">
                            <select
                                className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-4 px-4 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                            >
                                {BRANDS[device].map((b) => (
                                    <option key={b}>{b}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                <span className="material-icons">expand_more</span>
                            </div>
                        </div>
                    </div>

                    {/* Issue Select */}
                    <div className="md:col-span-4 space-y-3">
                        <label className="block text-sm font-semibold text-slate-700">Common Issue</label>
                        <div className="relative">
                            <select
                                className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-4 px-4 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                value={issue}
                                onChange={(e) => setIssue(e.target.value)}
                            >
                                {ISSUES.map((i) => (
                                    <option key={i}>{i}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                <span className="material-icons">expand_more</span>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="md:col-span-12 pt-2">
                        <button
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2 group"
                            type="button"
                            onClick={handleSubmit}
                        >
                            Get Estimate &amp; Book
                            <span className="material-icons group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BookingForm;
