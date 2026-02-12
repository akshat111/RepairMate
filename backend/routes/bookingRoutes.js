const express = require('express');
const {
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
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = express.Router();

// All booking routes require authentication
router.use(protect);

// ── User routes ───────────────────────────────────────
router.post('/', validate(schemas.booking.create), createBooking);
router.get('/my', validate(schemas.booking.query, 'query'), getMyBookings);
router.get('/:id', validate(schemas.mongoIdParam, 'params'), getBooking);
router.patch(
    '/:id/cancel',
    validate(schemas.mongoIdParam, 'params'),
    validate(schemas.booking.cancel),
    cancelBooking
);

// ── Technician routes ─────────────────────────────────
router.get('/assigned/me', validate(schemas.booking.query, 'query'), authorize('technician', 'admin'), getAssignedBookings);
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

module.exports = router;
