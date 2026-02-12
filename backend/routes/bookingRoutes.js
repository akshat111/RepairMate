const express = require('express');
const {
    createBooking,
    getMyBookings,
    getBooking,
    getAllBookings,
    updateBookingStatus,
    assignTechnician,
    cancelBooking,
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All booking routes require authentication
router.use(protect);

// ── User routes ───────────────────────────────────────
router.post('/', createBooking);
router.get('/my', getMyBookings);
router.get('/:id', getBooking);
router.patch('/:id/cancel', cancelBooking);

// ── Admin routes ──────────────────────────────────────
router.get('/', authorize('admin'), getAllBookings);
router.patch('/:id/status', authorize('admin'), updateBookingStatus);
router.patch('/:id/assign', authorize('admin'), assignTechnician);

module.exports = router;
