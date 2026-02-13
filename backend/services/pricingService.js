const PricingRule = require('../models/PricingRule');

// ═══════════════════════════════════════════════════════
// PRICING SERVICE
// ═══════════════════════════════════════════════════════
//
// Centralized pricing logic. All price calculations flow
// through this service — controllers never compute prices
// directly. This makes it easy to add discounts, coupons,
// seasonal pricing, etc. later.
// ═══════════════════════════════════════════════════════

/**
 * Default fallback pricing when no rule exists in the DB.
 * Only used as a safety net — admins should configure rules.
 */
const DEFAULT_PRICING = {
    basePrice: 500,
    currency: 'INR',
    urgencyMultipliers: { normal: 1.0, urgent: 1.5, emergency: 2.0 },
};

/**
 * Calculate the estimated cost for a booking.
 *
 * @param {Object}  options
 * @param {string}  options.serviceType  - e.g. 'laptop', 'mobile'
 * @param {string}  [options.issueType]  - e.g. 'screen_repair', 'battery'
 * @param {string}  [options.urgency]    - 'normal' | 'urgent' | 'emergency'
 * @returns {Promise<Object>} { estimatedCost, priceRange, rule, currency }
 */
const calculatePrice = async ({ serviceType, issueType, urgency = 'normal' }) => {
    let rule = null;

    // 1. Try exact match: serviceType + issueType
    if (issueType) {
        rule = await PricingRule.findRule(serviceType, issueType);
    }

    // 2. Fallback: try serviceType + 'general'
    if (!rule) {
        rule = await PricingRule.findRule(serviceType, 'general');
    }

    // 3. Use defaults if no rule found at all
    const pricing = rule || DEFAULT_PRICING;
    const multiplier = pricing.urgencyMultipliers?.[urgency] ?? 1.0;
    const estimatedCost = Math.round(pricing.basePrice * multiplier);

    return {
        estimatedCost,
        currency: pricing.currency || 'INR',
        priceRange: rule
            ? { min: rule.minPrice || estimatedCost, max: rule.maxPrice || estimatedCost }
            : null,
        ruleId: rule?._id || null,
        breakdown: {
            basePrice: pricing.basePrice,
            urgency,
            multiplier,
            computed: estimatedCost,
        },
    };
};

/**
 * Get all available pricing for a service type.
 * Useful for showing users what repair options cost.
 *
 * @param {string} serviceType
 * @returns {Promise<Array>}
 */
const getPricingForService = async (serviceType) => {
    const rules = await PricingRule.findByService(serviceType);

    return rules.map((rule) => ({
        issueType: rule.issueType,
        basePrice: rule.basePrice,
        currency: rule.currency,
        priceRange: {
            min: rule.minPrice || rule.basePrice,
            max: rule.maxPrice || rule.basePrice,
        },
        urgencyMultipliers: rule.urgencyMultipliers,
        description: rule.description,
    }));
};

module.exports = {
    calculatePrice,
    getPricingForService,
    DEFAULT_PRICING,
};
