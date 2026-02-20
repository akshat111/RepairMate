const express = require('express');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const bookingRoutes = require('./bookingRoutes');
const technicianRoutes = require('./technicianRoutes');
const pricingRoutes = require('./pricingRoutes');
const paymentRoutes = require('./paymentRoutes');
const earningsRoutes = require('./earningsRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const adminRoutes = require('./adminRoutes');
const inventoryRoutes = require('./inventoryRoutes');

const router = express.Router();

// ── Mount route modules ───────────────────────────────
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/bookings', bookingRoutes);
router.use('/technicians', technicianRoutes);
router.use('/pricing', pricingRoutes);
router.use('/payments', paymentRoutes);
router.use('/earnings', earningsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admin', adminRoutes);
router.use('/inventory', inventoryRoutes);

module.exports = router;

