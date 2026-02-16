const REVIEWS = [
    {
        name: 'Priya Sharma',
        location: 'Bengaluru',
        rating: 5,
        device: 'iPhone 14 Pro',
        review:
            'My iPhone screen cracked badly after a fall. The technician arrived within 40 minutes and replaced it right in front of me. Looks brand new! Very professional service and the 6-month warranty gives me peace of mind.',
        date: 'Jan 2026',
    },
    {
        name: 'Rohit Mehta',
        location: 'Bangalore',
        rating: 5,
        device: 'MacBook Air M2',
        review:
            'Battery was draining in 2 hours. Booked through RepairMate at night, technician came next morning. He explained everything clearly, replaced the battery, and it lasts the whole day now. Fair pricing too — no hidden charges.',
        date: 'Dec 2025',
    },
    {
        name: 'Ananya Reddy',
        location: 'Bangalore',
        rating: 4,
        device: 'Samsung Galaxy S23',
        review:
            'Charging port stopped working suddenly. The repair was done at my home in about 30 minutes. Only reason for 4 stars is the technician was 15 minutes late, but he was very polite and skilled. Would definitely use again.',
        date: 'Feb 2026',
    },
    {
        name: 'Arjun Patel',
        location: 'Bangalore',
        rating: 5,
        device: 'Dell XPS 15',
        review:
            'Laptop keyboard had multiple dead keys. I was worried it would take days but the technician fixed it on the spot. The upfront pricing was exactly what I paid — no surprises. Highly recommend RepairMate to everyone!',
        date: 'Jan 2026',
    },
];

const StarRating = ({ rating }) => (
    <div className="mb-2">
        {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={`text-sm mr-px ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
        ))}
    </div>
);

const ReviewsSection = () => {
    return (
        <section className="py-20 bg-slate-50" id="reviews">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <span className="text-primary font-bold tracking-wider uppercase text-sm">Reviews</span>
                    <h2 className="text-3xl md:text-4xl font-extrabold mt-2 mb-4 text-slate-900">What Our Customers Say</h2>
                    <p className="text-slate-600">
                        Real experiences from real people who trusted RepairMate with their devices.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {REVIEWS.map((review) => (
                        <div key={review.name} className="bg-white p-6 rounded-xl border border-slate-100 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                                    {review.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900">{review.name}</h4>
                                    <span className="text-xs text-slate-500">{review.location}</span>
                                </div>
                            </div>
                            <StarRating rating={review.rating} />
                            <p className="text-xs text-primary font-medium mb-2">🔧 {review.device}</p>
                            <p className="text-sm text-slate-500 leading-relaxed mb-3">&ldquo;{review.review}&rdquo;</p>
                            <span className="text-xs text-slate-400">{review.date}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ReviewsSection;
