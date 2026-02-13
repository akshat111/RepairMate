const Booking = require('../models/Booking');
const Technician = require('../models/Technician');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { findBestMatch } = require('../services/technicianMatcher');
const { calculatePrice } = require('../services/pricingService');
const { generateEarning } = require('../services/earningsService');
const { bookingBus, BOOKING_EVENTS } = require('../services/bookingEvents');
const { cancelBooking: cancelBookingSvc } = require('../services/cancellationService');
const { rescheduleBooking: rescheduleBookingSvc } = require('../services/rescheduleService');
const logger = require('../utils/logger');

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
        serviceType, issueType, urgency, description, deviceInfo,
        preferredDate, preferredTimeSlot,
        address, notes,
    } = req.body;

    // ── Calculate price from pricing rules ───────────────
    const pricing = await calculatePrice({ serviceType, issueType, urgency });

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
        issueType,
        urgency,
        description,
        deviceInfo,
        preferredDate,
        preferredTimeSlot,
        address,
        notes,
        estimatedCost: pricing.estimatedCost,
        pricingBreakdown: {
            ...pricing.breakdown,
            ruleId: pricing.ruleId,
        },
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
 * @desc    Cancel own booking (user) — with full financial cleanup
 * @route   PATCH /api/v1/bookings/:id/cancel
 * @access  Private (owner)
 */
const cancelBooking = asyncHandler(async (req, res) => {
    const result = await cancelBookingSvc(req.params.id, {
        cancelledBy: req.user._id,
        role: 'user',
        reason: req.body.reason,
    });

    res.status(200).json({
        success: true,
        message: 'Booking cancelled successfully',
        data: {
            booking: result.booking,
            refund: result.refund,
            earningReversed: result.earningReversed,
        },
    });
});

/**
 * @desc    Reschedule own booking
 * @route   PATCH /api/v1/bookings/:id/reschedule
 * @access  Private (owner)
 */
const rescheduleBooking = asyncHandler(async (req, res) => {
    const { preferredDate, preferredTimeSlot, reason } = req.body;

    const result = await rescheduleBookingSvc(req.params.id, {
        rescheduledBy: req.user._id,
        role: 'user',
        newDate: preferredDate,
        newTimeSlot: preferredTimeSlot,
        reason,
    });

    res.status(200).json({
        success: true,
        message: 'Booking rescheduled successfully',
        data: {
            booking: result.booking,
            priceChanged: result.priceChanged,
            technicianReassigned: result.technicianReassigned,
        },
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
    // Verify caller is a technician
    const techProfile = await Technician.findOne({ user: req.user._id });
    if (!techProfile) {
        throw new AppError('Technician profile not found', 403);
    }

    // ── Atomic start: status must be 'assigned', tech must match, must be paid ──
    const booking = await Booking.findOneAndUpdate(
        {
            _id: req.params.id,
            status: 'assigned',
            technician: techProfile._id,
            paymentStatus: 'paid',
        },
        {
            $set: {
                status: 'in_progress',
                startedAt: new Date(),
            },
            $push: {
                statusHistory: {
                    status: 'in_progress',
                    changedBy: req.user._id,
                    changedAt: new Date(),
                },
            },
        },
        { new: true }
    );

    if (!booking) {
        const exists = await Booking.findById(req.params.id);
        if (!exists) throw new AppError('Booking not found', 404);
        if (!exists.technician || exists.technician.toString() !== techProfile._id.toString()) {
            throw new AppError('You are not assigned to this booking', 403);
        }
        if (exists.paymentStatus !== 'paid') {
            throw new AppError(
                'Cannot start work on an unpaid booking. Payment must be completed first.',
                402
            );
        }
        throw new AppError(
            `Cannot start a booking with status '${exists.status}'`,
            409
        );
    }

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
    // Verify caller is a technician
    const techProfile = await Technician.findOne({ user: req.user._id });
    if (!techProfile) {
        throw new AppError('Technician profile not found', 403);
    }

    // Build update payload
    const updateFields = {
        status: 'completed',
        completedAt: new Date(),
    };
    if (req.body.finalCost !== undefined) updateFields.finalCost = req.body.finalCost;
    if (req.body.notes) updateFields.notes = req.body.notes;

    // ── Atomic complete: status must be 'in_progress' + tech must match ──
    const booking = await Booking.findOneAndUpdate(
        {
            _id: req.params.id,
            status: 'in_progress',
            technician: techProfile._id,
        },
        {
            $set: updateFields,
            $push: {
                statusHistory: {
                    status: 'completed',
                    changedBy: req.user._id,
                    changedAt: new Date(),
                    note: req.body.notes,
                },
            },
        },
        { new: true }
    );

    if (!booking) {
        const exists = await Booking.findById(req.params.id);
        if (!exists) throw new AppError('Booking not found', 404);
        if (!exists.technician || exists.technician.toString() !== techProfile._id.toString()) {
            throw new AppError('You are not assigned to this booking', 403);
        }
        throw new AppError(
            `Cannot complete a booking with status '${exists.status}'`,
            409
        );
    }

    // Emit real-time event
    bookingBus.emit(BOOKING_EVENTS.COMPLETED, {
        booking,
        userId: booking.user.toString(),
        technicianId: req.user._id.toString(),
        changedBy: req.user._id.toString(),
        previousStatus: 'in_progress',
        newStatus: 'completed',
    });

    // ── Generate technician earnings (idempotent) ────
    let earning = null;
    try {
        earning = await generateEarning({
            booking,
            technician: techProfile,
            techUserId: req.user._id,
        });
    } catch (err) {
        logger.warn('Earnings generation failed', { error: err.message, bookingId: req.params.id });
    }

    res.status(200).json({
        success: true,
        message: 'Booking completed',
        data: { booking, earning },
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

    // ── Atomic assign: only if status is 'pending' AND no technician yet ──
    const booking = await Booking.findOneAndUpdate(
        {
            _id: req.params.id,
            status: 'pending',
            technician: null,
        },
        {
            $set: {
                technician: technicianId,
                status: 'assigned',
            },
            $push: {
                statusHistory: {
                    status: 'assigned',
                    changedBy: req.user._id,
                    changedAt: new Date(),
                },
            },
        },
        { new: true }
    );

    if (!booking) {
        const exists = await Booking.findById(req.params.id);
        if (!exists) throw new AppError('Booking not found', 404);
        if (exists.technician) {
            throw new AppError(
                'Booking already has a technician assigned. Cannot double-assign.',
                409
            );
        }
        throw new AppError(
            `Cannot assign technician to a booking with status '${exists.status}'`,
            409
        );
    }

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

    // Validate the target status is a known status
    if (!TRANSITIONS[status] && !Object.values(TRANSITIONS).some(t => t[status])) {
        throw new AppError(`'${status}' is not a valid booking status`, 400);
    }

    // Build dynamic update — only set fields relevant to the target status
    const updateFields = { status };
    const historyEntry = { status, changedBy: req.user._id, changedAt: new Date() };
    if (notes) {
        updateFields.adminNotes = notes;
        historyEntry.note = notes;
    }
    if (status === 'completed') updateFields.completedAt = new Date();
    if (status === 'cancelled') {
        updateFields.cancelledAt = new Date();
        updateFields.cancellationReason = cancellationReason || 'Cancelled by admin';
    }

    // Determine which current statuses can transition to the target
    const validFromStatuses = Object.entries(TRANSITIONS)
        .filter(([, targets]) => targets[status] && targets[status].includes('admin'))
        .map(([from]) => from);

    if (validFromStatuses.length === 0) {
        throw new AppError(`Admin cannot transition any booking to status '${status}'`, 400);
    }

    // ── Atomic status update with transition guard ──
    const booking = await Booking.findOneAndUpdate(
        {
            _id: req.params.id,
            status: { $in: validFromStatuses },
        },
        {
            $set: updateFields,
            $push: { statusHistory: historyEntry },
        },
        { new: true }
    );

    if (!booking) {
        const exists = await Booking.findById(req.params.id);
        if (!exists) throw new AppError('Booking not found', 404);
        throw new AppError(
            `Admin cannot transition from '${exists.status}' to '${status}'`,
            409
        );
    }

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
/**
 * @desc    Admin cancel booking with full financial cleanup
 * @route   PATCH /api/v1/bookings/:id/admin-cancel
 * @access  Private (admin)
 */
const adminCancelBooking = asyncHandler(async (req, res) => {
    const result = await cancelBookingSvc(req.params.id, {
        cancelledBy: req.user._id,
        role: 'admin',
        reason: req.body.reason || 'Cancelled by admin',
    });

    res.status(200).json({
        success: true,
        message: 'Booking cancelled by admin',
        data: {
            booking: result.booking,
            refund: result.refund,
            earningReversed: result.earningReversed,
        },
    });
});

/**
 * @desc    Admin reschedule booking
 * @route   PATCH /api/v1/bookings/:id/admin-reschedule
 * @access  Private (admin)
 */
const adminRescheduleBooking = asyncHandler(async (req, res) => {
    const { preferredDate, preferredTimeSlot, reason } = req.body;

    const result = await rescheduleBookingSvc(req.params.id, {
        rescheduledBy: req.user._id,
        role: 'admin',
        newDate: preferredDate,
        newTimeSlot: preferredTimeSlot,
        reason,
    });

    res.status(200).json({
        success: true,
        message: 'Booking rescheduled by admin',
        data: {
            booking: result.booking,
            priceChanged: result.priceChanged,
            technicianReassigned: result.technicianReassigned,
        },
    });
});

module.exports = {
    createBooking,
    getMyBookings,
    getBooking,
    cancelBooking,
    rescheduleBooking,
    getAssignedBookings,
    startBooking,
    completeBooking,
    getAllBookings,
    assignTechnician,
    updateBookingStatus,
    adminCancelBooking,
    adminRescheduleBooking,
};
