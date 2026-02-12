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
const {
    validateBookingCreate,
    validateStatusUpdate,
    validateAssignment,
} = require('../middleware/validateBooking');

const router = express.Router();

// All booking routes require authentication
router.use(protect);

// ── User routes ───────────────────────────────────────
router.post('/', validateBookingCreate, createBooking);
router.get('/my', getMyBookings);
router.get('/:id', getBooking);
router.patch('/:id/cancel', cancelBooking);

// ── Technician routes ─────────────────────────────────
router.get('/assigned/me', authorize('technician', 'admin'), getAssignedBookings);
router.patch('/:id/start', authorize('technician'), startBooking);
router.patch('/:id/complete', authorize('technician'), completeBooking);

// ── Admin routes ──────────────────────────────────────
router.get('/', authorize('admin'), getAllBookings);
router.patch('/:id/assign', authorize('admin'), validateAssignment, assignTechnician);
router.patch('/:id/status', authorize('admin'), validateStatusUpdate, updateBookingStatus);

module.exports = router;
