const express = require('express');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const bookingRoutes = require('./bookingRoutes');
const technicianRoutes = require('./technicianRoutes');

const router = express.Router();

// ── Mount route modules ───────────────────────────────
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/bookings', bookingRoutes);
router.use('/technicians', technicianRoutes);

// Add more route modules here as the app grows:
// router.use('/users',  userRoutes);

module.exports = router;
