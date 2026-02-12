const Booking = require('../models/Booking');
const Technician = require('../models/Technician');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// ── Valid status transitions ──────────────────────────
const STATUS_TRANSITIONS = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['assigned', 'cancelled'],
    assigned: ['in-progress', 'cancelled'],
    'in-progress': ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
};

/**
 * @desc    Create a new booking
 * @route   POST /api/v1/bookings
 * @access  Private (user)
 */
const createBooking = asyncHandler(async (req, res) => {
    // Attach logged-in user
    req.body.user = req.user._id;

    // Prevent non-admin from setting status or technician at creation
    delete req.body.status;
    delete req.body.technician;
    delete req.body.statusHistory;

    const booking = await Booking.create({
        ...req.body,
        statusHistory: [
            {
                status: 'pending',
                changedBy: req.user._id,
            },
        ],
    });

    res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: { booking },
    });
});

/**
 * @desc    Get bookings for the logged-in user
 * @route   GET /api/v1/bookings/my
 * @access  Private (user)
 */
const getMyBookings = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { user: req.user._id };
    if (status) filter.status = status;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [bookings, total] = await Promise.all([
        Booking.find(filter)
            .populate('technician', 'specializations averageRating')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit, 10)),
        Booking.countDocuments(filter),
    ]);

    res.status(200).json({
        success: true,
        count: bookings.length,
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
        data: { bookings },
    });
});

/**
 * @desc    Get a single booking by ID
 * @route   GET /api/v1/bookings/:id
 * @access  Private (owner / admin)
 */
const getBooking = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id)
        .populate('user', 'name email phone')
        .populate('technician', 'specializations averageRating');

    if (!booking) {
        throw new AppError('Booking not found', 404);
    }

    // Only owner or admin can view
    if (
        booking.user._id.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin'
    ) {
        throw new AppError('Not authorized to view this booking', 403);
    }

    res.status(200).json({
        success: true,
        data: { booking },
    });
});

/**
 * @desc    Get all bookings (with filters & pagination)
 * @route   GET /api/v1/bookings
 * @access  Private (admin)
 */
const getAllBookings = asyncHandler(async (req, res) => {
    const { status, user, technician, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (user) filter.user = user;
    if (technician) filter.technician = technician;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [bookings, total] = await Promise.all([
        Booking.find(filter)
            .populate('user', 'name email phone')
            .populate('technician', 'specializations averageRating')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit, 10)),
        Booking.countDocuments(filter),
    ]);

    res.status(200).json({
        success: true,
        count: bookings.length,
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
        data: { bookings },
    });
});

/**
 * @desc    Update booking status
 * @route   PATCH /api/v1/bookings/:id/status
 * @access  Private (admin)
 */
const updateBookingStatus = asyncHandler(async (req, res) => {
    const { status, notes } = req.body;

    if (!status) {
        throw new AppError('Status is required', 400);
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        throw new AppError('Booking not found', 404);
    }

    // Validate status transition
    const allowedTransitions = STATUS_TRANSITIONS[booking.status];
    if (!allowedTransitions || !allowedTransitions.includes(status)) {
        throw new AppError(
            `Cannot transition from '${booking.status}' to '${status}'`,
            400
        );
    }

    booking.status = status;
    booking.statusHistory.push({
        status,
        changedBy: req.user._id,
    });

    if (notes) booking.adminNotes = notes;
    if (status === 'completed') booking.completedAt = new Date();
    if (status === 'cancelled') {
        booking.cancelledAt = new Date();
        if (req.body.cancellationReason) {
            booking.cancellationReason = req.body.cancellationReason;
        }
    }

    await booking.save();

    res.status(200).json({
        success: true,
        message: `Booking status updated to '${status}'`,
        data: { booking },
    });
});

/**
 * @desc    Assign a technician to a booking
 * @route   PATCH /api/v1/bookings/:id/assign
 * @access  Private (admin)
 */
const assignTechnician = asyncHandler(async (req, res) => {
    const { technicianId } = req.body;

    if (!technicianId) {
        throw new AppError('Technician ID is required', 400);
    }

    // Verify technician exists and is available
    const technician = await Technician.findById(technicianId);
    if (!technician) {
        throw new AppError('Technician not found', 404);
    }
    if (!technician.isAvailable) {
        throw new AppError('Technician is currently unavailable', 400);
    }
    if (!technician.isVerified) {
        throw new AppError('Technician is not yet verified', 400);
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
        throw new AppError('Booking not found', 404);
    }

    if (booking.status === 'completed' || booking.status === 'cancelled') {
        throw new AppError(
            `Cannot assign technician to a ${booking.status} booking`,
            400
        );
    }

    booking.technician = technicianId;

    // Auto-move to 'assigned' if currently pending or confirmed
    if (booking.status === 'pending' || booking.status === 'confirmed') {
        booking.status = 'assigned';
        booking.statusHistory.push({
            status: 'assigned',
            changedBy: req.user._id,
        });
    }

    await booking.save();

    const populated = await booking.populate(
        'technician',
        'specializations averageRating'
    );

    res.status(200).json({
        success: true,
        message: 'Technician assigned successfully',
        data: { booking: populated },
    });
});

/**
 * @desc    Cancel a booking (by the owner)
 * @route   PATCH /api/v1/bookings/:id/cancel
 * @access  Private (owner)
 */
const cancelBooking = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        throw new AppError('Booking not found', 404);
    }

    // Only owner can cancel through this route
    if (booking.user.toString() !== req.user._id.toString()) {
        throw new AppError('Not authorized to cancel this booking', 403);
    }

    if (booking.status === 'completed' || booking.status === 'cancelled') {
        throw new AppError(`Cannot cancel a ${booking.status} booking`, 400);
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancellationReason = req.body.reason || 'Cancelled by user';
    booking.statusHistory.push({
        status: 'cancelled',
        changedBy: req.user._id,
    });

    await booking.save();

    res.status(200).json({
        success: true,
        message: 'Booking cancelled successfully',
        data: { booking },
    });
});

module.exports = {
    createBooking,
    getMyBookings,
    getBooking,
    getAllBookings,
    updateBookingStatus,
    assignTechnician,
    cancelBooking,
};
