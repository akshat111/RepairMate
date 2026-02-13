const PricingRule = require('../models/PricingRule');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { getPricingForService } = require('../services/pricingService');

// ═══════════════════════════════════════════════════════
// PUBLIC ENDPOINT
// ═══════════════════════════════════════════════════════

/**
 * @desc    Get pricing for a service type (public)
 * @route   GET /api/v1/pricing/:serviceType
 * @access  Public
 */
const getServicePricing = asyncHandler(async (req, res) => {
    const pricing = await getPricingForService(req.params.serviceType);

    res.status(200).json({
        success: true,
        count: pricing.length,
        data: { pricing },
    });
});

// ═══════════════════════════════════════════════════════
// ADMIN ENDPOINTS
// ═══════════════════════════════════════════════════════

/**
 * @desc    Get all pricing rules
 * @route   GET /api/v1/pricing
 * @access  Private (admin)
 */
const getAllRules = asyncHandler(async (req, res) => {
    const { serviceType, isActive } = req.query;

    const filter = {};
    if (serviceType) filter.serviceType = serviceType.toLowerCase();
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const rules = await PricingRule.find(filter)
        .sort({ serviceType: 1, issueType: 1 });

    res.status(200).json({
        success: true,
        count: rules.length,
        data: { rules },
    });
});

/**
 * @desc    Create a pricing rule
 * @route   POST /api/v1/pricing
 * @access  Private (admin)
 */
const createRule = asyncHandler(async (req, res) => {
    req.body.createdBy = req.user._id;

    const rule = await PricingRule.create(req.body);

    res.status(201).json({
        success: true,
        message: 'Pricing rule created',
        data: { rule },
    });
});

/**
 * @desc    Update a pricing rule
 * @route   PUT /api/v1/pricing/:id
 * @access  Private (admin)
 */
const updateRule = asyncHandler(async (req, res) => {
    req.body.updatedBy = req.user._id;

    const rule = await PricingRule.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    if (!rule) {
        throw new AppError('Pricing rule not found', 404);
    }

    res.status(200).json({
        success: true,
        message: 'Pricing rule updated',
        data: { rule },
    });
});

/**
 * @desc    Delete a pricing rule
 * @route   DELETE /api/v1/pricing/:id
 * @access  Private (admin)
 */
const deleteRule = asyncHandler(async (req, res) => {
    const rule = await PricingRule.findByIdAndDelete(req.params.id);

    if (!rule) {
        throw new AppError('Pricing rule not found', 404);
    }

    res.status(200).json({
        success: true,
        message: 'Pricing rule deleted',
    });
});

/**
 * @desc    Seed default pricing rules
 * @route   POST /api/v1/pricing/seed
 * @access  Private (admin)
 */
const seedDefaults = asyncHandler(async (req, res) => {
    const defaults = [
        // ── Mobile ─────────────────────────────────────────
        { serviceType: 'mobile', issueType: 'general', basePrice: 500, minPrice: 300, maxPrice: 800, description: 'General mobile diagnosis and repair' },
        { serviceType: 'mobile', issueType: 'screen_repair', basePrice: 1500, minPrice: 1000, maxPrice: 3000, description: 'Screen replacement or crack repair' },
        { serviceType: 'mobile', issueType: 'battery', basePrice: 800, minPrice: 500, maxPrice: 1200, description: 'Battery replacement' },
        { serviceType: 'mobile', issueType: 'water_damage', basePrice: 2000, minPrice: 1500, maxPrice: 4000, description: 'Water damage recovery' },
        { serviceType: 'mobile', issueType: 'charging_port', basePrice: 600, minPrice: 400, maxPrice: 1000, description: 'Charging port repair or replacement' },
        { serviceType: 'mobile', issueType: 'software', basePrice: 400, minPrice: 200, maxPrice: 800, description: 'Software issues, OS reinstall, data recovery' },

        // ── Laptop ─────────────────────────────────────────
        { serviceType: 'laptop', issueType: 'general', basePrice: 800, minPrice: 500, maxPrice: 1200, description: 'General laptop diagnosis and repair' },
        { serviceType: 'laptop', issueType: 'screen_repair', basePrice: 3000, minPrice: 2000, maxPrice: 6000, description: 'Screen replacement' },
        { serviceType: 'laptop', issueType: 'battery', basePrice: 1500, minPrice: 1000, maxPrice: 2500, description: 'Battery replacement' },
        { serviceType: 'laptop', issueType: 'keyboard', basePrice: 1200, minPrice: 800, maxPrice: 2000, description: 'Keyboard replacement' },
        { serviceType: 'laptop', issueType: 'motherboard', basePrice: 4000, minPrice: 2500, maxPrice: 8000, description: 'Motherboard repair or replacement' },
        { serviceType: 'laptop', issueType: 'software', basePrice: 600, minPrice: 400, maxPrice: 1000, description: 'OS reinstall, virus removal, optimization' },

        // ── Tablet ─────────────────────────────────────────
        { serviceType: 'tablet', issueType: 'general', basePrice: 600, minPrice: 400, maxPrice: 1000, description: 'General tablet diagnosis and repair' },
        { serviceType: 'tablet', issueType: 'screen_repair', basePrice: 2000, minPrice: 1500, maxPrice: 4000, description: 'Tablet screen replacement' },
        { serviceType: 'tablet', issueType: 'battery', basePrice: 1000, minPrice: 700, maxPrice: 1800, description: 'Tablet battery replacement' },

        // ── Desktop ────────────────────────────────────────
        { serviceType: 'desktop', issueType: 'general', basePrice: 700, minPrice: 400, maxPrice: 1200, description: 'General desktop diagnosis and repair' },
        { serviceType: 'desktop', issueType: 'hardware', basePrice: 1500, minPrice: 800, maxPrice: 3000, description: 'Hardware component replacement' },
        { serviceType: 'desktop', issueType: 'software', basePrice: 500, minPrice: 300, maxPrice: 800, description: 'OS reinstall, optimization' },
    ];

    // Use upsert to avoid duplicates
    const results = await Promise.allSettled(
        defaults.map((rule) =>
            PricingRule.findOneAndUpdate(
                { serviceType: rule.serviceType, issueType: rule.issueType },
                { ...rule, createdBy: req.user._id },
                { upsert: true, new: true, runValidators: true }
            )
        )
    );

    const created = results.filter((r) => r.status === 'fulfilled').length;

    res.status(200).json({
        success: true,
        message: `${created} pricing rules seeded successfully`,
    });
});

module.exports = {
    getServicePricing,
    getAllRules,
    createRule,
    updateRule,
    deleteRule,
    seedDefaults,
};
