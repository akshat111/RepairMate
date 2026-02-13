const mongoose = require('mongoose');

// ═══════════════════════════════════════════════════════
// BOOKING STATUS LIFECYCLE
// ═══════════════════════════════════════════════════════
//
//  pending ──→ assigned ──→ in_progress ──→ completed
//     │            │             │
//     └────────────┴─────────────┘
//               cancelled
//
// ═══════════════════════════════════════════════════════

const VALID_STATUSES = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'];

const bookingSchema = new mongoose.Schema(
    {
        // ── Parties ───────────────────────────────────────
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Booking must belong to a user'],
        },
        technician: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Technician',
            default: null,
        },

        // ── Service details ───────────────────────────────
        serviceType: {
            type: String,
            required: [true, 'Service type is required'],
            trim: true,
            maxlength: [100, 'Service type cannot exceed 100 characters'],
        },
        issueType: {
            type: String,
            trim: true,
            maxlength: [50, 'Issue type cannot exceed 50 characters'],
        },
        urgency: {
            type: String,
            enum: ['normal', 'urgent', 'emergency'],
            default: 'normal',
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
        },
        deviceInfo: {
            brand: { type: String, trim: true },
            model: { type: String, trim: true },
            issue: { type: String, trim: true },
        },

        // ── Scheduling ────────────────────────────────────
        preferredDate: {
            type: Date,
            required: [true, 'Preferred date is required'],
        },
        preferredTimeSlot: {
            type: String,
            enum: ['morning', 'afternoon', 'evening'],
            default: 'morning',
        },

        // ── Address ───────────────────────────────────────
        address: {
            street: { type: String, trim: true },
            city: { type: String, trim: true },
            state: { type: String, trim: true },
            zipCode: { type: String, trim: true },
        },

        // ── Status ────────────────────────────────────────
        status: {
            type: String,
            enum: VALID_STATUSES,
            default: 'pending',
        },

        // ── Pricing ───────────────────────────────────────
        estimatedCost: {
            type: Number,
            min: [0, 'Cost cannot be negative'],
        },
        finalCost: {
            type: Number,
            min: [0, 'Cost cannot be negative'],
        },
        pricingBreakdown: {
            basePrice: Number,
            urgency: String,
            multiplier: Number,
            computed: Number,
            ruleId: { type: mongoose.Schema.Types.ObjectId, ref: 'PricingRule' },
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
            default: 'pending',
        },
        isPaid: {
            type: Boolean,
            default: false,
        },

        // ── Notes & history ───────────────────────────────
        notes: {
            type: String,
            maxlength: [2000, 'Notes cannot exceed 2000 characters'],
        },
        adminNotes: {
            type: String,
            maxlength: [2000, 'Admin notes cannot exceed 2000 characters'],
        },
        statusHistory: [
            {
                status: { type: String, enum: VALID_STATUSES },
                changedAt: { type: Date, default: Date.now },
                changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                note: { type: String },
            },
        ],

        completedAt: { type: Date },
        cancelledAt: { type: Date },
        cancellationReason: { type: String, trim: true },
        startedAt: { type: Date }, // When technician marks in_progress

        // ── Reschedule tracking ───────────────────────────
        rescheduleCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        rescheduleHistory: [
            {
                from: {
                    date: Date,
                    timeSlot: String,
                },
                to: {
                    date: Date,
                    timeSlot: String,
                },
                reason: { type: String, trim: true },
                rescheduledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                rescheduledAt: { type: Date, default: Date.now },
            },
        ],
    },
    {
        timestamps: true,
    }
);

// ── Indexes ───────────────────────────────────────────
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ technician: 1, status: 1 });
bookingSchema.index({ status: 1, preferredDate: 1 });
bookingSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
