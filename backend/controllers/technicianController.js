const Technician = require('../models/Technician');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Register as a technician (creates technician profile)
 * @route   POST /api/v1/technicians/register
 * @access  Private (user)
 */
const registerTechnician = asyncHandler(async (req, res) => {
    // Check if user already has a technician profile
    const existing = await Technician.findOne({ user: req.user._id });
    if (existing) {
        throw new AppError('You already have a technician profile', 400);
    }

    const { specializations, experienceYears, certifications, serviceArea, hourlyRate } = req.body;

    const technician = await Technician.create({
        user: req.user._id,
        specializations,
        experienceYears,
        certifications,
        serviceArea,
        hourlyRate,
    });

    // Update user role to technician
    await User.findByIdAndUpdate(req.user._id, { role: 'technician' });

    res.status(201).json({
        success: true,
        message: 'Technician profile created. Awaiting admin verification.',
        data: { technician },
    });
});

/**
 * @desc    Get own technician profile
 * @route   GET /api/v1/technicians/me
 * @access  Private (technician)
 */
const getMyProfile = asyncHandler(async (req, res) => {
    const technician = await Technician.findOne({ user: req.user._id })
        .populate('user', 'name email phone avatar');

    if (!technician) {
        throw new AppError('Technician profile not found', 404);
    }

    res.status(200).json({
        success: true,
        data: { technician },
    });
});

/**
 * @desc    Update own technician profile
 * @route   PUT /api/v1/technicians/me
 * @access  Private (technician)
 */
const updateMyProfile = asyncHandler(async (req, res) => {
    const allowedFields = [
        'specializations', 'experienceYears', 'certifications',
        'serviceArea', 'hourlyRate', 'isAvailable', 'location',
    ];

    const updates = {};
    allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // Prevent technicians from changing their own verification status
    delete updates.verificationStatus;
    delete updates.verifiedAt;
    delete updates.rejectionReason;

    const technician = await Technician.findOneAndUpdate(
        { user: req.user._id },
        updates,
        { new: true, runValidators: true }
    );

    if (!technician) {
        throw new AppError('Technician profile not found', 404);
    }

    res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { technician },
    });
});

// ═══════════════════════════════════════════════════════
// ADMIN — Verification Workflow
// ═══════════════════════════════════════════════════════

/**
 * @desc    Get technicians by verification status
 * @route   GET /api/v1/technicians?status=pending
 * @access  Private (admin)
 */
const getAllTechnicians = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
        filter.verificationStatus = status;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [technicians, total] = await Promise.all([
        Technician.find(filter)
            .populate('user', 'name email phone avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit, 10)),
        Technician.countDocuments(filter),
    ]);

    res.status(200).json({
        success: true,
        count: technicians.length,
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
        data: { technicians },
    });
});

/**
 * @desc    Get a single technician by ID
 * @route   GET /api/v1/technicians/:id
 * @access  Private (admin)
 */
const getTechnician = asyncHandler(async (req, res) => {
    const technician = await Technician.findById(req.params.id)
        .populate('user', 'name email phone avatar');

    if (!technician) {
        throw new AppError('Technician not found', 404);
    }

    res.status(200).json({
        success: true,
        data: { technician },
    });
});

/**
 * @desc    Approve a technician
 * @route   PATCH /api/v1/technicians/:id/approve
 * @access  Private (admin)
 */
const approveTechnician = asyncHandler(async (req, res) => {
    const technician = await Technician.findById(req.params.id);

    if (!technician) {
        throw new AppError('Technician not found', 404);
    }

    if (technician.verificationStatus === 'approved') {
        throw new AppError('Technician is already approved', 400);
    }

    technician.verificationStatus = 'approved';
    technician.verifiedAt = new Date();
    technician.rejectionReason = undefined;
    await technician.save();

    res.status(200).json({
        success: true,
        message: 'Technician approved successfully',
        data: { technician },
    });
});

/**
 * @desc    Reject a technician
 * @route   PATCH /api/v1/technicians/:id/reject
 * @access  Private (admin)
 */
const rejectTechnician = asyncHandler(async (req, res) => {
    const { reason } = req.body;

    if (!reason) {
        throw new AppError('Rejection reason is required', 400);
    }

    const technician = await Technician.findById(req.params.id);

    if (!technician) {
        throw new AppError('Technician not found', 404);
    }

    if (technician.verificationStatus === 'rejected') {
        throw new AppError('Technician is already rejected', 400);
    }

    technician.verificationStatus = 'rejected';
    technician.rejectionReason = reason;
    technician.verifiedAt = undefined;
    await technician.save();

    res.status(200).json({
        success: true,
        message: 'Technician rejected',
        data: { technician },
    });
});

module.exports = {
    registerTechnician,
    getMyProfile,
    updateMyProfile,
    getAllTechnicians,
    getTechnician,
    approveTechnician,
    rejectTechnician,
};
