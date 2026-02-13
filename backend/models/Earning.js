const mongoose = require('mongoose');

// ═══════════════════════════════════════════════════════
// EARNING MODEL
// ═══════════════════════════════════════════════════════
//
// Records each earning event for a technician. One record
// per completed booking. Stores the full breakdown:
// booking amount, commission, and net payout.
// ═══════════════════════════════════════════════════════

const EARNING_STATUSES = ['pending', 'approved', 'paid', 'held', 'reversed'];

const earningSchema = new mongoose.Schema(
    {
        // ── References ──────────────────────────────────────
        technician: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Technician',
            required: true,
            index: true,
        },
        technicianUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking',
            required: true,
            unique: true, // One earning per booking
        },

        // ── Financial breakdown ─────────────────────────────
        bookingAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        commissionRate: {
            type: Number,
            required: true,
            min: 0,
            max: 1, // 0 to 1 (e.g. 0.15 = 15%)
        },
        commissionAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        netEarning: {
            type: Number,
            required: true,
            min: 0,
        },
        currency: {
            type: String,
            default: 'INR',
            uppercase: true,
            maxlength: 3,
        },

        // ── Bonus / deductions ──────────────────────────────
        bonus: {
            type: Number,
            default: 0,
            min: 0,
        },
        deductions: {
            type: Number,
            default: 0,
            min: 0,
        },
        bonusReason: {
            type: String,
            trim: true,
            maxlength: 300,
        },

        // ── Status ──────────────────────────────────────────
        status: {
            type: String,
            enum: EARNING_STATUSES,
            default: 'pending',
            index: true,
        },
        paidAt: { type: Date },
        paidVia: { type: String, trim: true }, // bank_transfer, upi, cash, etc.

        // ── Admin actions ───────────────────────────────────
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        approvedAt: { type: Date },
        notes: {
            type: String,
            trim: true,
            maxlength: 500,
        },
    },
    {
        timestamps: true,
    }
);

// ── Indexes ──────────────────────────────────────────
earningSchema.index({ technician: 1, createdAt: -1 });
earningSchema.index({ technicianUser: 1, status: 1 });
earningSchema.index({ status: 1, createdAt: -1 });
earningSchema.index({ createdAt: -1 });

// ── Virtual: total payout (netEarning + bonus - deductions)
earningSchema.virtual('totalPayout').get(function () {
    return this.netEarning + (this.bonus || 0) - (this.deductions || 0);
});

earningSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Earning', earningSchema);
