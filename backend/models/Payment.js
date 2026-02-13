const mongoose = require('mongoose');
const crypto = require('crypto');

// ═══════════════════════════════════════════════════════
// PAYMENT MODEL
// ═══════════════════════════════════════════════════════
//
// Records every payment transaction with full audit trail.
// Designed to be gateway-agnostic — the gateway field and
// gatewayResponse store provider-specific data.
// ═══════════════════════════════════════════════════════

const PAYMENT_STATUSES = ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'];
const PAYMENT_METHODS = ['card', 'upi', 'net_banking', 'wallet', 'cash', 'other'];

const paymentSchema = new mongoose.Schema(
    {
        // ── References ──────────────────────────────────────
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking',
            required: [true, 'Payment must be linked to a booking'],
            index: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Payment must belong to a user'],
            index: true,
        },

        // ── Transaction identifiers ─────────────────────────
        transactionId: {
            type: String,
            unique: true,
            required: true,
            index: true,
        },
        gatewayOrderId: {
            type: String,
            sparse: true,
            index: true,
        },
        gatewayPaymentId: {
            type: String,
            sparse: true,
        },

        // ── Amounts ─────────────────────────────────────────
        amount: {
            type: Number,
            required: [true, 'Payment amount is required'],
            min: [0, 'Amount cannot be negative'],
        },
        currency: {
            type: String,
            default: 'INR',
            uppercase: true,
            maxlength: 3,
        },
        refundedAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        // ── Status & method ─────────────────────────────────
        status: {
            type: String,
            enum: PAYMENT_STATUSES,
            default: 'pending',
            index: true,
        },
        method: {
            type: String,
            enum: PAYMENT_METHODS,
        },

        // ── Gateway details ─────────────────────────────────
        gateway: {
            type: String,
            default: 'manual',
            trim: true,
            lowercase: true,
        },
        gatewayResponse: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
            select: false, // Hide raw gateway data by default
        },

        // ── Metadata ────────────────────────────────────────
        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        failureReason: {
            type: String,
            trim: true,
        },

        // ── Refund tracking ─────────────────────────────────
        refunds: [
            {
                refundId: String,
                amount: { type: Number, required: true, min: 0 },
                reason: String,
                status: {
                    type: String,
                    enum: ['pending', 'completed', 'failed'],
                    default: 'pending',
                },
                processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                createdAt: { type: Date, default: Date.now },
            },
        ],

        // ── Timestamps ──────────────────────────────────────
        paidAt: { type: Date },
        processedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

// ── Indexes ──────────────────────────────────────────
paymentSchema.index({ booking: 1, status: 1 });
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ createdAt: -1 });

// ── Generate unique transaction ID before validation ──
paymentSchema.pre('validate', function (next) {
    if (!this.transactionId) {
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(6).toString('hex');
        this.transactionId = `TXN-${timestamp}-${random}`.toUpperCase();
    }
    next();
});

// ── Virtuals ─────────────────────────────────────────
paymentSchema.virtual('isRefundable').get(function () {
    return this.status === 'completed' && this.refundedAmount < this.amount;
});

paymentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Payment', paymentSchema);
