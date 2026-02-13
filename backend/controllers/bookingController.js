const Booking = require('../models/Booking');
const Technician = require('../models/Technician');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { findBestMatch } = require('../services/technicianMatcher');
const { bookingBus, BOOKING_EVENTS } = require('../services/bookingEvents');

// ═══════════════════════════════════════════════════════
// STATUS TRANSITION RULES
// Maps current status → { allowedNextStatuses, allowedRoles }
// ═══════════════════════════════════════════════════════
const TRANSITIONS = {
    pending: {
        assigned: ['admin'],
        cancelled: ['user', 'admin'],
    },
    assigned: {
        in_progress: ['technician'],
        cancelled: ['user', 'admin'],
    },
    in_progress: {
        completed: ['technician', 'admin'],
        cancelled: ['admin'],
    },
    completed: {},
    cancelled: {},
};

/**
 * Validates whether a role can perform a given status transition.
 * @returns {boolean}
 */
const canTransition = (currentStatus, newStatus, role) => {
    const allowed = TRANSITIONS[currentStatus];
    if (!allowed || !allowed[newStatus]) return false;
    return allowed[newStatus].includes(role);
};

// ═══════════════════════════════════════════════════════
// USER ENDPOINTS
// ═══════════════════════════════════════════════════════

/**
 * @desc    Create a new booking
 * @route   POST /api/v1/bookings
 * @access  Private (user)
 */
const createBooking = asyncHandler(async (req, res) => {
    const {
        serviceType, description, deviceInfo,
        preferredDate, preferredTimeSlot,
        address, notes, estimatedCost,
    } = req.body;

    // ── Attempt auto-assignment ───────────────────────
    const matchedTech = await findBestMatch({ serviceType });

    const statusHistory = [{ status: 'pending', changedBy: req.user._id }];
    let initialStatus = 'pending';
    let technicianId = null;

    if (matchedTech) {
        technicianId = matchedTech._id;
        initialStatus = 'assigned';
        statusHistory.push({
            status: 'assigned',
            changedBy: req.user._id,
            note: 'Auto-assigned by matching engine',
        });
    }

    const booking = await Booking.create({
        user: req.user._id,
        serviceType,
        description,
        deviceInfo,
        preferredDate,
        preferredTimeSlot,
        address,
        notes,
        estimatedCost,
        technician: technicianId,
        status: initialStatus,
        statusHistory,
    });

    // Populate technician info if assigned
    if (technicianId) {
        await booking.populate('technician', 'specializations averageRating');
    }

    // Emit real-time event
    bookingBus.emit(BOOKING_EVENTS.CREATED, {
        booking,
        userId: req.user._id.toString(),
        technicianId: matchedTech ? matchedTech.user?.toString() : null,
        changedBy: req.user._id.toString(),
        previousStatus: null,
        newStatus: initialStatus,
    });

    res.status(201).json({
        success: true,
        message: matchedTech
            ? 'Booking created and technician auto-assigned'
            : 'Booking created. Awaiting technician assignment.',
        autoAssigned: !!matchedTech,
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
 * @access  Private (owner / assigned technician / admin)
 */
const getBooking = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id)
        .populate('user', 'name email phone')
        .populate('technician', 'specializations averageRating user');

    if (!booking) {
        throw new AppError('Booking not found', 404);
    }

    const isOwner = booking.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isAssignedTechnician =
        booking.technician &&
        booking.technician.user &&
        booking.technician.user.toString() === req.user._id.toString();

    if (!isOwner && !isAdmin && !isAssignedTechnician) {
        throw new AppError('Not authorized to view this booking', 403);
    }

    res.status(200).json({
        success: true,
        data: { booking },
    });
});

/**
 * @desc    Cancel own booking (user)
 * @route   PATCH /api/v1/bookings/:id/cancel
 * @access  Private (owner)
 */
const cancelBooking = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        throw new AppError('Booking not found', 404);
    }

    // Ownership check
    if (booking.user.toString() !== req.user._id.toString()) {
        throw new AppError('Not authorized to cancel this booking', 403);
    }

    // Validate the transition for user role
    if (!canTransition(booking.status, 'cancelled', 'user')) {
        throw new AppError(
            `Cannot cancel a booking with status '${booking.status}'`,
            400
        );
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancellationReason = req.body.reason || 'Cancelled by user';
    booking.statusHistory.push({
        status: 'cancelled',
        changedBy: req.user._id,
        note: booking.cancellationReason,
    });

    await booking.save();

    // Emit real-time event
    const techProfile = booking.technician
        ? await Technician.findById(booking.technician)
        : null;
    bookingBus.emit(BOOKING_EVENTS.CANCELLED, {
        booking,
        userId: booking.user.toString(),
        technicianId: techProfile?.user?.toString() || null,
        changedBy: req.user._id.toString(),
        previousStatus: 'pending',
        newStatus: 'cancelled',
    });

    res.status(200).json({
        success: true,
        message: 'Booking cancelled successfully',
        data: { booking },
    });
});

// ═══════════════════════════════════════════════════════
// TECHNICIAN ENDPOINTS
// ═══════════════════════════════════════════════════════

/**
 * @desc    Get bookings assigned to the logged-in technician
 * @route   GET /api/v1/bookings/assigned
 * @access  Private (technician)
 */
const getAssignedBookings = asyncHandler(async (req, res) => {
    const techProfile = await Technician.findOne({ user: req.user._id });

    if (!techProfile) {
        throw new AppError('No technician profile found for this user', 404);
    }

    const { status, page = 1, limit = 10 } = req.query;

    const filter = { technician: techProfile._id };
    if (status) filter.status = status;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [bookings, total] = await Promise.all([
        Booking.find(filter)
            .populate('user', 'name email phone')
            .sort({ preferredDate: 1 })
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
 * @desc    Mark booking as in_progress (technician starts work)
 * @route   PATCH /api/v1/bookings/:id/start
 * @access  Private (assigned technician)
 */
const startBooking = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        throw new AppError('Booking not found', 404);
    }

    // Verify caller is the assigned technician
    const techProfile = await Technician.findOne({ user: req.user._id });
    if (
        !techProfile ||
        !booking.technician ||
        booking.technician.toString() !== techProfile._id.toString()
    ) {
        throw new AppError('You are not assigned to this booking', 403);
    }

    if (!canTransition(booking.status, 'in_progress', 'technician')) {
        throw new AppError(
            `Cannot start a booking with status '${booking.status}'`,
            400
        );
    }

    booking.status = 'in_progress';
    booking.startedAt = new Date();
    booking.statusHistory.push({
        status: 'in_progress',
        changedBy: req.user._id,
    });

    await booking.save();

    // Emit real-time event
    bookingBus.emit(BOOKING_EVENTS.STARTED, {
        booking,
        userId: booking.user.toString(),
        technicianId: req.user._id.toString(),
        changedBy: req.user._id.toString(),
        previousStatus: 'assigned',
        newStatus: 'in_progress',
    });

    res.status(200).json({
        success: true,
        message: 'Booking marked as in progress',
        data: { booking },
    });
});

/**
 * @desc    Mark booking as completed (technician finishes work)
 * @route   PATCH /api/v1/bookings/:id/complete
 * @access  Private (assigned technician)
 */
const completeBooking = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        throw new AppError('Booking not found', 404);
    }

    // Verify caller is the assigned technician
    const techProfile = await Technician.findOne({ user: req.user._id });
    if (
        !techProfile ||
        !booking.technician ||
        booking.technician.toString() !== techProfile._id.toString()
    ) {
        throw new AppError('You are not assigned to this booking', 403);
    }

    if (!canTransition(booking.status, 'completed', 'technician')) {
        throw new AppError(
            `Cannot complete a booking with status '${booking.status}'`,
            400
        );
    }

    booking.status = 'completed';
    booking.completedAt = new Date();
    if (req.body.finalCost !== undefined) booking.finalCost = req.body.finalCost;
    if (req.body.notes) booking.notes = req.body.notes;
    booking.statusHistory.push({
        status: 'completed',
        changedBy: req.user._id,
        note: req.body.notes,
    });

    await booking.save();

    // Emit real-time event
    bookingBus.emit(BOOKING_EVENTS.COMPLETED, {
        booking,
        userId: booking.user.toString(),
        technicianId: req.user._id.toString(),
        changedBy: req.user._id.toString(),
        previousStatus: 'in_progress',
        newStatus: 'completed',
    });

    res.status(200).json({
        success: true,
        message: 'Booking completed',
        data: { booking },
    });
});

// ═══════════════════════════════════════════════════════
// ADMIN ENDPOINTS
// ═══════════════════════════════════════════════════════

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
 * @desc    Assign a technician to a booking
 * @route   PATCH /api/v1/bookings/:id/assign
 * @access  Private (admin only)
 */
const assignTechnician = asyncHandler(async (req, res) => {
    const { technicianId } = req.body;

    // Verify technician exists, is available, and is approved
    const technician = await Technician.findById(technicianId);
    if (!technician) {
        throw new AppError('Technician not found', 404);
    }
    if (!technician.isAvailable) {
        throw new AppError('Technician is currently unavailable', 400);
    }
    if (technician.verificationStatus !== 'approved') {
        throw new AppError('Technician is not verified', 400);
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
        throw new AppError('Booking not found', 404);
    }

    if (!canTransition(booking.status, 'assigned', 'admin')) {
        throw new AppError(
            `Cannot assign technician to a booking with status '${booking.status}'`,
            400
        );
    }

    booking.technician = technicianId;
    booking.status = 'assigned';
    booking.statusHistory.push({
        status: 'assigned',
        changedBy: req.user._id,
    });

    await booking.save();

    // Emit real-time event
    bookingBus.emit(BOOKING_EVENTS.ASSIGNED, {
        booking,
        userId: booking.user.toString(),
        technicianId: technician.user.toString(),
        changedBy: req.user._id.toString(),
        previousStatus: 'pending',
        newStatus: 'assigned',
    });

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
 * @desc    Admin force-update booking status
 * @route   PATCH /api/v1/bookings/:id/status
 * @access  Private (admin)
 */
const updateBookingStatus = asyncHandler(async (req, res) => {
    const { status, notes, cancellationReason } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        throw new AppError('Booking not found', 404);
    }

    if (!canTransition(booking.status, status, 'admin')) {
        throw new AppError(
            `Admin cannot transition from '${booking.status}' to '${status}'`,
            400
        );
    }

    booking.status = status;
    booking.statusHistory.push({
        status,
        changedBy: req.user._id,
        note: notes,
    });

    if (notes) booking.adminNotes = notes;
    if (status === 'completed') booking.completedAt = new Date();
    if (status === 'cancelled') {
        booking.cancelledAt = new Date();
        booking.cancellationReason = cancellationReason || 'Cancelled by admin';
    }

    await booking.save();

    // Emit real-time event
    const techDoc = booking.technician
        ? await Technician.findById(booking.technician)
        : null;
    bookingBus.emit(BOOKING_EVENTS.STATUS_CHANGED, {
        booking,
        userId: booking.user.toString(),
        technicianId: techDoc?.user?.toString() || null,
        changedBy: req.user._id.toString(),
        previousStatus: booking.statusHistory[booking.statusHistory.length - 2]?.status || null,
        newStatus: status,
    });

    res.status(200).json({
        success: true,
        message: `Booking status updated to '${status}'`,
        data: { booking },
    });
});

module.exports = {
    createBooking,
    getMyBookings,
    getBooking,
    cancelBooking,
    getAssignedBookings,
    startBooking,
    completeBooking,
    getAllBookings,
    assignTechnician,
    updateBookingStatus,
};
