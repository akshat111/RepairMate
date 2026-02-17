import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import bookingService from '../services/bookingService';
import { useAuth } from '../context/AuthContext';

// ═══════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════

const DEVICE_TYPES = [
    { id: 'mobile', label: 'Mobile', icon: 'smartphone' },
    { id: 'laptop', label: 'Laptop', icon: 'laptop_mac' },
    { id: 'smartwatch', label: 'Smartwatch', icon: 'watch' },
];

const BRANDS = [
    { id: 'apple', label: 'Apple', letter: 'A' },
    { id: 'samsung', label: 'Samsung', letter: 'S' },
    { id: 'google', label: 'Google', letter: 'G' },
    { id: 'oneplus', label: 'OnePlus', letter: '1+' },
];

const MODELS = {
    apple: ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15', 'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14', 'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13 Mini', 'iPad Air', 'iPad Pro', 'MacBook Pro', 'MacBook Air'],
    samsung: ['Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24', 'Galaxy S23 Ultra', 'Galaxy S23', 'Galaxy Z Fold 5', 'Galaxy Z Flip 5', 'Galaxy A54', 'Galaxy Tab S9'],
    google: ['Pixel 8 Pro', 'Pixel 8', 'Pixel 7 Pro', 'Pixel 7a', 'Pixel 7', 'Pixel Watch 2'],
    oneplus: ['OnePlus 12', 'OnePlus 12R', 'OnePlus 11', 'OnePlus Nord 3', 'OnePlus Open'],
};

const ISSUES = [
    { id: 'screen', label: 'Screen Damage', icon: 'broken_image', price: 2499 },
    { id: 'battery', label: 'Battery Issue', icon: 'battery_alert', price: 1499 },
    { id: 'charging', label: 'Charging Port', icon: 'power', price: 999 },
    { id: 'water', label: 'Water Damage', icon: 'water_drop', price: 1999 },
    { id: 'speaker', label: 'Speaker/Mic', icon: 'volume_off', price: 1299 },
    { id: 'camera', label: 'Camera Issue', icon: 'camera_alt', price: 1799 },
];

const TIME_SLOTS = [
    { id: 'morning', label: 'Morning', time: '9:00 AM – 12:00 PM', icon: 'wb_sunny' },
    { id: 'afternoon', label: 'Afternoon', time: '12:00 PM – 4:00 PM', icon: 'wb_cloudy' },
    { id: 'evening', label: 'Evening', time: '4:00 PM – 7:00 PM', icon: 'nights_stay' },
];

const SERVICE_CHARGE = 199;

const STEPS = ['Device', 'Issue', 'Schedule', 'Details'];

// ═══════════════════════════════════════════════════════
// BOOK REPAIR PAGE
// ═══════════════════════════════════════════════════════

const BookRepair = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // ── Multi-step state ──────────────────────────────
    const [currentStep, setCurrentStep] = useState(0);

    // Step 1: Device
    const [deviceType, setDeviceType] = useState('mobile');
    const [brand, setBrand] = useState('apple');
    const [model, setModel] = useState('');

    // Step 2: Issue
    const [selectedIssues, setSelectedIssues] = useState([]);
    const [description, setDescription] = useState('');

    // Step 3: Schedule
    const [preferredDate, setPreferredDate] = useState('');
    const [timeSlot, setTimeSlot] = useState('morning');
    const [urgency, setUrgency] = useState('normal');

    // Step 4: Details
    const [address, setAddress] = useState({ street: '', city: '', state: '', zipCode: '' });
    const [phone, setPhone] = useState('');
    const [altPhone, setAltPhone] = useState('');
    const [landmark, setLandmark] = useState('');
    const [notes, setNotes] = useState('');

    // Submission
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    // ── Derived values ────────────────────────────────
    const availableModels = MODELS[brand] || [];
    const selectedModel = model || (availableModels.length > 0 ? availableModels[0] : '');

    const issueTotal = selectedIssues.reduce((sum, issueId) => {
        const issue = ISSUES.find((i) => i.id === issueId);
        return sum + (issue?.price || 0);
    }, 0);
    const estimatedTotal = issueTotal + (issueTotal > 0 ? SERVICE_CHARGE : 0);

    // ── Step validation ───────────────────────────────
    const canProceed = () => {
        switch (currentStep) {
            case 0: return deviceType && brand && selectedModel;
            case 1: return selectedIssues.length > 0;
            case 2: return preferredDate && timeSlot;
            case 3: return address.street && address.city && phone.length >= 10;
            default: return false;
        }
    };

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
    };
    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(currentStep - 1);
    };

    const toggleIssue = (issueId) => {
        setSelectedIssues((prev) =>
            prev.includes(issueId) ? prev.filter((id) => id !== issueId) : [...prev, issueId]
        );
    };

    // ── Submit booking ────────────────────────────────
    const handleSubmit = async () => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const issueLabels = selectedIssues.map((id) => ISSUES.find((i) => i.id === id)?.label).filter(Boolean);
            await bookingService.create({
                serviceType: deviceType,
                issueType: issueLabels.join(', '),
                urgency,
                description: description || issueLabels.join(', '),
                deviceInfo: {
                    brand: BRANDS.find((b) => b.id === brand)?.label || brand,
                    model: selectedModel,
                    issue: issueLabels.join(', '),
                },
                preferredDate,
                preferredTimeSlot: timeSlot,
                address: { ...address, landmark },
                phone,
                altPhone,
                notes,
            });
            navigate('/dashboard');
        } catch (err) {
            setSubmitError(err.response?.data?.message || err.message || 'Failed to create booking');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Today's date (for min date picker) ────────────
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="bg-background-light font-display text-slate-800 min-h-screen flex flex-col">
            {/* Navbar */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <Link to="/" className="flex items-center gap-2 no-underline">
                            <div className="bg-primary/10 p-2 rounded-lg">
                                <span className="material-icons text-primary">build</span>
                            </div>
                            <span className="font-bold text-xl tracking-tight text-slate-900">RepairMate</span>
                        </Link>
                        <div className="flex items-center space-x-4 text-sm font-medium">
                            <Link to="/#how-it-works" className="text-slate-500 hover:text-primary transition-colors no-underline">How it works</Link>
                            <Link to="/#services" className="text-slate-500 hover:text-primary transition-colors no-underline">Pricing</Link>
                            <Link to={user ? '/dashboard' : '/login'} className="flex items-center text-primary bg-primary/10 px-4 py-2 rounded-lg hover:bg-primary/20 transition-colors no-underline">
                                <span className="material-icons text-sm mr-2">support_agent</span>
                                Need Help?
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-grow flex items-start justify-center py-10 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Booking Flow */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Progress Stepper */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                            <div className="flex items-center justify-between relative">
                                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-slate-100 -z-0" />
                                {STEPS.map((step, idx) => (
                                    <div
                                        key={step}
                                        className="relative z-10 flex flex-col items-center group cursor-pointer"
                                        onClick={() => idx < currentStep && setCurrentStep(idx)}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${idx < currentStep
                                            ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                            : idx === currentStep
                                                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                                : 'bg-white border-2 border-slate-200 text-slate-400'
                                            }`}>
                                            {idx < currentStep ? (
                                                <span className="material-icons text-sm">check</span>
                                            ) : (
                                                idx + 1
                                            )}
                                        </div>
                                        <span className={`mt-2 text-xs font-${idx <= currentStep ? 'semibold' : 'medium'} ${idx <= currentStep ? 'text-primary' : 'text-slate-400'
                                            }`}>
                                            {step}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Step 1: Device Selection */}
                        {currentStep === 0 && (
                            <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-slate-900 mb-2">What device needs fixing?</h2>
                                    <p className="text-slate-500">Select your device type and brand to get started.</p>
                                </div>

                                {/* Device Type Toggle */}
                                <div className="flex space-x-4 mb-8">
                                    {DEVICE_TYPES.map((dt) => (
                                        <label key={dt.id} className="flex-1 relative cursor-pointer group">
                                            <input
                                                type="radio"
                                                name="device_type"
                                                checked={deviceType === dt.id}
                                                onChange={() => setDeviceType(dt.id)}
                                                className="peer sr-only"
                                            />
                                            <div className="h-full p-4 rounded-xl border-2 border-slate-200 peer-checked:border-primary peer-checked:bg-primary/5 hover:border-primary/50 transition-all flex flex-col items-center justify-center text-center">
                                                <span className={`material-icons text-4xl mb-2 ${deviceType === dt.id ? 'text-primary' : 'text-slate-400'}`}>{dt.icon}</span>
                                                <span className={`font-semibold ${deviceType === dt.id ? 'text-primary' : 'text-slate-700'}`}>{dt.label}</span>
                                            </div>
                                            <div className={`absolute top-2 right-2 transition-opacity ${deviceType === dt.id ? 'opacity-100' : 'opacity-0'}`}>
                                                <span className="material-icons text-primary text-xl">check_circle</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                {/* Brand Grid */}
                                <h3 className="text-sm uppercase tracking-wider font-semibold text-slate-500 mb-4">Select Brand</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {BRANDS.map((b) => (
                                        <label key={b.id} className="relative cursor-pointer group">
                                            <input
                                                type="radio"
                                                name="brand"
                                                checked={brand === b.id}
                                                onChange={() => { setBrand(b.id); setModel(''); }}
                                                className="peer sr-only"
                                            />
                                            <div className={`p-4 rounded-xl border bg-slate-50 hover:bg-white hover:shadow-md transition-all flex flex-col items-center justify-center h-32 ${brand === b.id ? 'border-primary ring-1 ring-primary' : 'border-slate-200'
                                                }`}>
                                                <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mb-3">
                                                    <span className="font-bold text-lg text-slate-600">{b.letter}</span>
                                                </div>
                                                <span className="font-medium text-slate-700">{b.label}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                {/* Model Select */}
                                <div className="mt-8 pt-6 border-t border-slate-100">
                                    <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="model-select">Select Model</label>
                                    <select
                                        id="model-select"
                                        value={selectedModel}
                                        onChange={(e) => setModel(e.target.value)}
                                        className="block w-full pl-3 pr-10 py-3 text-base border-slate-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-lg bg-white text-slate-900 shadow-sm"
                                    >
                                        {availableModels.map((m) => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Issue Selection */}
                        {currentStep === 1 && (
                            <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-slate-900 mb-2">What&apos;s the issue?</h2>
                                    <p className="text-slate-500">Select one or more issues with your device.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    {ISSUES.map((issue) => {
                                        const isSelected = selectedIssues.includes(issue.id);
                                        return (
                                            <button
                                                key={issue.id}
                                                onClick={() => toggleIssue(issue.id)}
                                                className={`p-4 border rounded-lg flex items-center justify-between transition-all text-left ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-slate-200 hover:border-primary/50'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={`material-icons ${isSelected ? 'text-primary' : 'text-slate-400'}`}>{issue.icon}</span>
                                                    <div>
                                                        <span className={`font-medium ${isSelected ? 'text-primary' : 'text-slate-700'}`}>{issue.label}</span>
                                                        <p className="text-xs text-slate-500">From ₹{issue.price}</p>
                                                    </div>
                                                </div>
                                                <span className={`material-icons ${isSelected ? 'text-primary' : 'text-slate-400'}`}>
                                                    {isSelected ? 'check_box' : 'check_box_outline_blank'}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="issue-desc">Describe the issue (optional)</label>
                                    <textarea
                                        id="issue-desc"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                        maxLength={1000}
                                        placeholder="E.g. Screen cracked on the top left corner..."
                                        className="block w-full py-3 px-4 text-sm border-slate-300 focus:outline-none focus:ring-primary focus:border-primary rounded-lg bg-white text-slate-900 shadow-sm resize-none"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 3: Schedule */}
                        {currentStep === 2 && (
                            <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-slate-900 mb-2">When should we come?</h2>
                                    <p className="text-slate-500">Pick a date and time that works for you.</p>
                                </div>

                                <div className="space-y-6">
                                    {/* Date */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="repair-date">Preferred Date</label>
                                        <input
                                            id="repair-date"
                                            type="date"
                                            value={preferredDate}
                                            min={today}
                                            onChange={(e) => setPreferredDate(e.target.value)}
                                            className="block w-full py-3 px-4 text-base border-slate-300 focus:outline-none focus:ring-primary focus:border-primary rounded-lg bg-white text-slate-900 shadow-sm"
                                        />
                                    </div>

                                    {/* Time Slot */}
                                    <div>
                                        <p className="text-sm font-medium text-slate-700 mb-3">Time Slot</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            {TIME_SLOTS.map((slot) => (
                                                <label key={slot.id} className="relative cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="time_slot"
                                                        checked={timeSlot === slot.id}
                                                        onChange={() => setTimeSlot(slot.id)}
                                                        className="peer sr-only"
                                                    />
                                                    <div className={`p-4 rounded-xl border-2 transition-all text-center ${timeSlot === slot.id ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/50'
                                                        }`}>
                                                        <span className={`material-icons text-2xl mb-1 ${timeSlot === slot.id ? 'text-primary' : 'text-slate-400'}`}>{slot.icon}</span>
                                                        <p className={`font-semibold text-sm ${timeSlot === slot.id ? 'text-primary' : 'text-slate-700'}`}>{slot.label}</p>
                                                        <p className="text-xs text-slate-500 mt-0.5">{slot.time}</p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Urgency */}
                                    <div>
                                        <p className="text-sm font-medium text-slate-700 mb-3">Urgency</p>
                                        <div className="flex gap-3">
                                            {['normal', 'urgent', 'emergency'].map((u) => (
                                                <button
                                                    key={u}
                                                    onClick={() => setUrgency(u)}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all capitalize ${urgency === u
                                                        ? u === 'emergency' ? 'border-red-500 bg-red-50 text-red-700' : u === 'urgent' ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-primary bg-primary/5 text-primary'
                                                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                                        }`}
                                                >
                                                    {u}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Address & Details */}
                        {currentStep === 3 && (
                            <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Where should we come?</h2>
                                    <p className="text-slate-500">Enter your contact info, service address, and any extra notes.</p>
                                </div>
                                <div className="space-y-4">
                                    {/* Phone Numbers */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="phone">Phone Number <span className="text-red-400">*</span></label>
                                            <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" maxLength={10} className="block w-full py-3 px-4 text-sm border-slate-300 focus:outline-none focus:ring-primary focus:border-primary rounded-lg bg-white text-slate-900 shadow-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="alt-phone">Alternate Phone (optional)</label>
                                            <input id="alt-phone" type="tel" value={altPhone} onChange={(e) => setAltPhone(e.target.value)} placeholder="9123456789" maxLength={10} className="block w-full py-3 px-4 text-sm border-slate-300 focus:outline-none focus:ring-primary focus:border-primary rounded-lg bg-white text-slate-900 shadow-sm" />
                                        </div>
                                    </div>
                                    {/* Street Address */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="addr-street">Street Address <span className="text-red-400">*</span></label>
                                        <input id="addr-street" type="text" value={address.street} onChange={(e) => setAddress((p) => ({ ...p, street: e.target.value }))} placeholder="123, MG Road, Flat 4B" className="block w-full py-3 px-4 text-sm border-slate-300 focus:outline-none focus:ring-primary focus:border-primary rounded-lg bg-white text-slate-900 shadow-sm" />
                                    </div>
                                    {/* Landmark */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="landmark">Landmark (optional)</label>
                                        <input id="landmark" type="text" value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="Near City Mall, Opposite SBI Bank" className="block w-full py-3 px-4 text-sm border-slate-300 focus:outline-none focus:ring-primary focus:border-primary rounded-lg bg-white text-slate-900 shadow-sm" />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="addr-city">City <span className="text-red-400">*</span></label>
                                            <input id="addr-city" type="text" value={address.city} onChange={(e) => setAddress((p) => ({ ...p, city: e.target.value }))} placeholder="Mumbai" className="block w-full py-3 px-4 text-sm border-slate-300 focus:outline-none focus:ring-primary focus:border-primary rounded-lg bg-white text-slate-900 shadow-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="addr-state">State</label>
                                            <input id="addr-state" type="text" value={address.state} onChange={(e) => setAddress((p) => ({ ...p, state: e.target.value }))} placeholder="Maharashtra" className="block w-full py-3 px-4 text-sm border-slate-300 focus:outline-none focus:ring-primary focus:border-primary rounded-lg bg-white text-slate-900 shadow-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="addr-zip">Pin Code</label>
                                            <input id="addr-zip" type="text" value={address.zipCode} onChange={(e) => setAddress((p) => ({ ...p, zipCode: e.target.value }))} placeholder="400001" maxLength={6} className="block w-full py-3 px-4 text-sm border-slate-300 focus:outline-none focus:ring-primary focus:border-primary rounded-lg bg-white text-slate-900 shadow-sm" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="notes">Additional Notes (optional)</label>
                                        <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={2000} placeholder="E.g. Ring the doorbell, ask for Rahul..." className="block w-full py-3 px-4 text-sm border-slate-300 focus:outline-none focus:ring-primary focus:border-primary rounded-lg bg-white text-slate-900 shadow-sm resize-none" />
                                    </div>
                                </div>

                                {submitError && (
                                    <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                                        <span className="material-icons text-red-500 text-lg">error</span>
                                        {submitError}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Sticky Summary */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-24 space-y-6">
                            {/* Estimate Card */}
                            <div className="bg-white rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200 overflow-hidden">
                                <div className="p-6 bg-slate-50 border-b border-slate-100">
                                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <span className="material-icons text-primary text-xl">receipt_long</span>
                                        Booking Summary
                                    </h2>
                                </div>
                                <div className="p-6 space-y-6">
                                    {/* Selected Device */}
                                    <div className="flex items-start gap-4 pb-6 border-b border-dashed border-slate-200">
                                        <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                                            <span className="material-icons text-3xl text-slate-400">
                                                {DEVICE_TYPES.find((d) => d.id === deviceType)?.icon || 'devices'}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800">{selectedModel || 'Select a model'}</h3>
                                            <p className="text-sm text-slate-500 mt-1">{BRANDS.find((b) => b.id === brand)?.label} · {DEVICE_TYPES.find((d) => d.id === deviceType)?.label}</p>
                                            {currentStep > 0 && (
                                                <button onClick={() => setCurrentStep(0)} className="text-xs text-primary font-medium hover:underline mt-2">Change device</button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Selected Issues */}
                                    <div className="space-y-3">
                                        {selectedIssues.length > 0 ? (
                                            selectedIssues.map((issueId) => {
                                                const issue = ISSUES.find((i) => i.id === issueId);
                                                return (
                                                    <div key={issueId} className="flex justify-between items-center text-sm">
                                                        <div className="flex items-center gap-2 text-slate-600">
                                                            <span className="w-2 h-2 rounded-full bg-primary" />
                                                            {issue?.label}
                                                        </div>
                                                        <span className="font-semibold text-slate-900">₹{issue?.price}</span>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="text-sm text-slate-400 italic">No issues selected yet</p>
                                        )}
                                        {issueTotal > 0 && (
                                            <>
                                                <div className="flex justify-between items-center text-sm">
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <span className="w-2 h-2 rounded-full bg-primary" />
                                                        Diagnostic Fee
                                                    </div>
                                                    <span className="font-semibold text-slate-900">Free</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <span className="w-2 h-2 rounded-full bg-slate-300" />
                                                        Service Charge
                                                    </div>
                                                    <span className="font-semibold text-slate-900">₹{SERVICE_CHARGE}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Total */}
                                    <div className="pt-6 border-t border-slate-200">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-sm font-medium text-slate-500">Total Estimate</span>
                                            <span className="text-3xl font-bold text-primary">₹{estimatedTotal}</span>
                                        </div>
                                        <p className="text-xs text-right text-slate-400">Includes all taxes &amp; fees</p>
                                    </div>

                                    {/* Action Button */}
                                    {currentStep < STEPS.length - 1 ? (
                                        <button
                                            onClick={handleNext}
                                            disabled={!canProceed()}
                                            className="w-full py-4 bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-primary/30 transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            Next Step
                                            <span className="material-icons text-sm">arrow_forward</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleSubmit}
                                            disabled={!canProceed() || isSubmitting}
                                            className="w-full py-4 bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-primary/30 transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                    </svg>
                                                    Booking...
                                                </>
                                            ) : (
                                                <>
                                                    Confirm Booking
                                                    <span className="material-icons text-sm">check</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                    {currentStep > 0 && (
                                        <button
                                            onClick={handleBack}
                                            className="w-full py-3 mt-2 bg-white border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            <span className="material-icons text-sm">arrow_back</span>
                                            Previous Step
                                        </button>
                                    )}
                                </div>

                                {/* Trust Badges */}
                                <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-around">
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="material-icons text-primary/60 text-xl">verified_user</span>
                                        <span className="text-[10px] uppercase font-bold text-slate-500">Warranty</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="material-icons text-primary/60 text-xl">schedule</span>
                                        <span className="text-[10px] uppercase font-bold text-slate-500">Fast</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="material-icons text-primary/60 text-xl">lock</span>
                                        <span className="text-[10px] uppercase font-bold text-slate-500">Secure</span>
                                    </div>
                                </div>
                            </div>


                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
                    <p>© 2023 RepairMate. All rights reserved.</p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        <Link to="/" className="hover:text-primary transition-colors no-underline">Privacy Policy</Link>
                        <Link to="/" className="hover:text-primary transition-colors no-underline">Terms of Service</Link>
                        <Link to="/" className="hover:text-primary transition-colors no-underline">Support</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default BookRepair;
