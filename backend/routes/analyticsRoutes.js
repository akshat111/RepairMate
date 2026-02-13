const express = require('express');
const {
    dashboard,
    revenue,
    revenueTrend,
    bookings,
    payouts,
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// ── All analytics routes are admin-only ───────────────
router.use(protect, authorize('admin'));

router.get('/dashboard', dashboard);
router.get('/revenue', revenue);
router.get('/revenue/trend', revenueTrend);
router.get('/bookings', bookings);
router.get('/payouts', payouts);

module.exports = router;
