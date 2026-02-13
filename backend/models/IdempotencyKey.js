const mongoose = require('mongoose');

// ═══════════════════════════════════════════════════════
// IDEMPOTENCY KEY MODEL
// ═══════════════════════════════════════════════════════
//
// Stores a mapping of client-provided idempotency keys to
// their cached responses. TTL index auto-cleans old entries.
// ═══════════════════════════════════════════════════════

const idempotencyKeySchema = new mongoose.Schema(
    {
        // Compound key: user + idempotency key
        key: {
            type: String,
            required: true,
            trim: true,
            maxlength: 255,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // Request fingerprint
        method: { type: String, required: true },
        path: { type: String, required: true },

        // Processing state
        status: {
            type: String,
            enum: ['processing', 'completed', 'error'],
            default: 'processing',
        },

        // Cached response
        statusCode: { type: Number },
        responseBody: { type: mongoose.Schema.Types.Mixed },

        // Error details (if failed)
        errorMessage: { type: String },

        // Auto-expire after 24 hours
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
            index: { expires: 0 }, // TTL index
        },
    },
    {
        timestamps: true,
    }
);

// Compound unique index: one key per user
idempotencyKeySchema.index({ key: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('IdempotencyKey', idempotencyKeySchema);
