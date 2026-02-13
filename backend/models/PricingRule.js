const mongoose = require('mongoose');

// ═══════════════════════════════════════════════════════
// PRICING RULE MODEL
// ═══════════════════════════════════════════════════════
//
// Admin-configurable pricing rules stored in the database.
// Each rule maps a (serviceType, issueType) pair to a
// base price plus optional modifiers.
//
// Pricing formula:
//   estimatedCost = basePrice + urgencyMultiplier adjustment
// ═══════════════════════════════════════════════════════

const pricingRuleSchema = new mongoose.Schema(
    {
        // ── Match criteria ──────────────────────────────────
        serviceType: {
            type: String,
            required: [true, 'Service type is required'],
            trim: true,
            lowercase: true,
            index: true,
        },
        issueType: {
            type: String,
            required: [true, 'Issue type is required'],
            trim: true,
            lowercase: true,
        },

        // ── Pricing ─────────────────────────────────────────
        basePrice: {
            type: Number,
            required: [true, 'Base price is required'],
            min: [0, 'Base price cannot be negative'],
        },
        currency: {
            type: String,
            default: 'INR',
            uppercase: true,
            maxlength: 3,
        },

        // ── Urgency multipliers ─────────────────────────────
        urgencyMultipliers: {
            normal: { type: Number, default: 1.0, min: 0 },
            urgent: { type: Number, default: 1.5, min: 0 },
            emergency: { type: Number, default: 2.0, min: 0 },
        },

        // ── Price range (shown to user) ─────────────────────
        minPrice: {
            type: Number,
            min: [0, 'Min price cannot be negative'],
        },
        maxPrice: {
            type: Number,
            min: [0, 'Max price cannot be negative'],
        },

        // ── Metadata ────────────────────────────────────────
        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

// ── Compound uniqueness: one rule per (serviceType, issueType)
pricingRuleSchema.index({ serviceType: 1, issueType: 1 }, { unique: true });

// ── Static: find active rule for a service + issue combo
pricingRuleSchema.statics.findRule = async function (serviceType, issueType) {
    return this.findOne({
        serviceType: serviceType.toLowerCase(),
        issueType: issueType.toLowerCase(),
        isActive: true,
    });
};

// ── Static: find all rules for a service type
pricingRuleSchema.statics.findByService = async function (serviceType) {
    return this.find({
        serviceType: serviceType.toLowerCase(),
        isActive: true,
    }).sort({ issueType: 1 });
};

module.exports = mongoose.model('PricingRule', pricingRuleSchema);
