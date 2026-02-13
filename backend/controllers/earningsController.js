const Earning = require('../models/Earning');
const Technician = require('../models/Technician');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const {
    getEarningsDashboard,
    getPlatformSummary,
} = require('../services/earningsService');

// ═══════════════════════════════════════════════════════
// TECHNICIAN ENDPOINTS
// ═══════════════════════════════════════════════════════

/**
 * @desc    Get earnings dashboard for logged-in technician
 * @route   GET /api/v1/earnings/dashboard
 * @access  Private (technician)
 */
const dashboard = asyncHandler(async (req, res) => {
    const data = await getEarningsDashboard(req.user._id);

    res.status(200).json({
        success: true,
        data,
    });
});

/**
 * @desc    Get earnings history (paginated)
 * @route   GET /api/v1/earnings/my
 * @access  Private (technician)
 */
const getMyEarnings = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { technicianUser: req.user._id };
    if (status) filter.status = status;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [earnings, total] = await Promise.all([
        Earning.find(filter)
            .populate('booking', 'serviceType finalCost estimatedCost completedAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit, 10)),
        Earning.countDocuments(filter),
    ]);

    res.status(200).json({
        success: true,
        count: earnings.length,
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
        data: { earnings },
    });
});

// ═══════════════════════════════════════════════════════
// ADMIN ENDPOINTS
// ═══════════════════════════════════════════════════════

/**
 * @desc    Get platform-wide earnings summary
 * @route   GET /api/v1/earnings/platform
 * @access  Private (admin)
 */
const platformSummary = asyncHandler(async (req, res) => {
    const summary = await getPlatformSummary();

    res.status(200).json({
        success: true,
        data: { summary },
    });
});

/**
 * @desc    Get all earnings (admin)
 * @route   GET /api/v1/earnings
 * @access  Private (admin)
 */
const getAllEarnings = asyncHandler(async (req, res) => {
    const { status, technician, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (technician) filter.technician = technician;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [earnings, total] = await Promise.all([
        Earning.find(filter)
            .populate('technicianUser', 'name email')
            .populate('booking', 'serviceType finalCost')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit, 10)),
        Earning.countDocuments(filter),
    ]);

    res.status(200).json({
        success: true,
        count: earnings.length,
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
        data: { earnings },
    });
});

/**
 * @desc    Approve an earning for payout
 * @route   PATCH /api/v1/earnings/:id/approve
 * @access  Private (admin)
 */
const approveEarning = asyncHandler(async (req, res) => {
    const updateFields = {
        status: 'approved',
        approvedBy: req.user._id,
        approvedAt: new Date(),
    };
    if (req.body.notes) updateFields.notes = req.body.notes;
    if (req.body.bonus) {
        updateFields.bonus = req.body.bonus;
        updateFields.bonusReason = req.body.bonusReason || '';
    }
    if (req.body.deductions) updateFields.deductions = req.body.deductions;

    // ── Atomic: only approve 'pending' earnings ──
    const earning = await Earning.findOneAndUpdate(
        { _id: req.params.id, status: 'pending' },
        { $set: updateFields },
        { new: true }
    );

    if (!earning) {
        const exists = await Earning.findById(req.params.id);
        if (!exists) throw new AppError('Earning not found', 404);
        throw new AppError(
            `Cannot approve earning with status '${exists.status}'. Only 'pending' earnings can be approved.`,
            409
        );
    }

    res.status(200).json({
        success: true,
        message: 'Earning approved for payout',
        data: { earning },
    });
});

/**
 * @desc    Mark earning as paid
 * @route   PATCH /api/v1/earnings/:id/pay
 * @access  Private (admin)
 */
const markAsPaid = asyncHandler(async (req, res) => {
    const updateFields = {
        status: 'paid',
        paidAt: new Date(),
        paidVia: req.body.paidVia || 'bank_transfer',
    };
    if (req.body.notes) updateFields.notes = req.body.notes;

    // ── Atomic: only pay 'approved' earnings ──
    const earning = await Earning.findOneAndUpdate(
        { _id: req.params.id, status: 'approved' },
        { $set: updateFields },
        { new: true }
    );

    if (!earning) {
        const exists = await Earning.findById(req.params.id);
        if (!exists) throw new AppError('Earning not found', 404);
        throw new AppError(
            `Cannot mark earning as paid with status '${exists.status}'. Earning must be 'approved' first.`,
            409
        );
    }

    res.status(200).json({
        success: true,
        message: `Earning marked as paid via ${earning.paidVia}`,
        data: { earning },
    });
});

/**
 * @desc    Bulk approve pending earnings
 * @route   PATCH /api/v1/earnings/bulk-approve
 * @access  Private (admin)
 */
const bulkApprove = asyncHandler(async (req, res) => {
    const { earningIds } = req.body;

    const result = await Earning.updateMany(
        { _id: { $in: earningIds }, status: 'pending' },
        {
            status: 'approved',
            approvedBy: req.user._id,
            approvedAt: new Date(),
        }
    );

    res.status(200).json({
        success: true,
        message: `${result.modifiedCount} earnings approved`,
        data: { modifiedCount: result.modifiedCount },
    });
});

module.exports = {
    dashboard,
    getMyEarnings,
    platformSummary,
    getAllEarnings,
    approveEarning,
    markAsPaid,
    bulkApprove,
};
