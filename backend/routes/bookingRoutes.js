const express = require('express');
const {
    createBooking,
    getMyBookings,
    getBooking,
    cancelBooking,
    rescheduleBooking,
    getAssignedBookings,
    startBooking,
    acceptBooking,
    rejectAssignment,
    completeBooking,
    getAllBookings,
    assignTechnician,
    updateBookingStatus,
    adminCancelBooking,
    adminRescheduleBooking,
} = require('../controllers/bookingController');
const { protect, authorize, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');
const { idempotent } = require('../middleware/idempotent');

const router = express.Router();

// All booking routes require authentication
router.use(protect);

// ── User routes ───────────────────────────────────────
router.post('/', authorize('user'), validate(schemas.booking.create), idempotent(), createBooking);
router.get('/my', validate(schemas.booking.query, 'query'), getMyBookings);
router.get('/:id', validate(schemas.mongoIdParam, 'params'), getBooking);
router.patch(
    '/:id/cancel',
    validate(schemas.mongoIdParam, 'params'),
    validate(schemas.booking.cancel),
    idempotent(),
    cancelBooking
);
router.patch(
    '/:id/reschedule',
    validate(schemas.mongoIdParam, 'params'),
    validate(schemas.booking.reschedule),
    rescheduleBooking
);

// ── Technician routes ─────────────────────────────────
router.get('/assigned/me', validate(schemas.booking.query, 'query'), authorize('technician', 'admin'), getAssignedBookings);
router.patch('/:id/accept', validate(schemas.mongoIdParam, 'params'), authorize('technician'), acceptBooking);
router.patch('/:id/reject-assignment', validate(schemas.mongoIdParam, 'params'), authorize('technician'), rejectAssignment);
router.patch('/:id/start', validate(schemas.mongoIdParam, 'params'), authorize('technician'), startBooking);
router.patch(
    '/:id/complete',
    validate(schemas.mongoIdParam, 'params'),
    validate(schemas.booking.complete),
    authorize('technician'),
    completeBooking
);

// ── Admin routes ──────────────────────────────────────
router.get('/', authorize('admin'), validate(schemas.booking.query, 'query'), getAllBookings);
router.patch(
    '/:id/assign',
    validate(schemas.mongoIdParam, 'params'),
    validate(schemas.booking.assign),
    authorize('admin'),
    assignTechnician
);
router.patch(
    '/:id/status',
    validate(schemas.mongoIdParam, 'params'),
    validate(schemas.booking.updateStatus),
    authorize('admin'),
    updateBookingStatus
);
router.patch(
    '/:id/admin-cancel',
    validate(schemas.mongoIdParam, 'params'),
    validate(schemas.booking.cancel),
    adminOnly,
    idempotent(),
    adminCancelBooking
);
router.patch(
    '/:id/admin-reschedule',
    validate(schemas.mongoIdParam, 'params'),
    validate(schemas.booking.reschedule),
    adminOnly,
    adminRescheduleBooking
);

module.exports = router;

