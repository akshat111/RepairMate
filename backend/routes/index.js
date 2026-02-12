const express = require('express');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const bookingRoutes = require('./bookingRoutes');

const router = express.Router();

// ── Mount route modules ───────────────────────────────
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/bookings', bookingRoutes);

// Add more route modules here as the app grows:
// router.use('/users',  userRoutes);
// router.use('/repairs', repairRoutes);

module.exports = router;


