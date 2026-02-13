const express = require('express');
const {
    dashboard,
    getMyEarnings,
    platformSummary,
    getAllEarnings,
    approveEarning,
    markAsPaid,
    bulkApprove,
} = require('../controllers/earningsController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');
const { idempotent } = require('../middleware/idempotent');

const router = express.Router();

// ── All routes require authentication ─────────────────
router.use(protect);

// ── Technician routes ─────────────────────────────────
router.get('/dashboard', authorize('technician', 'admin'), dashboard);
router.get('/my', authorize('technician'), getMyEarnings);

// ── Admin routes ──────────────────────────────────────
router.get('/platform', authorize('admin'), platformSummary);
router.get('/', authorize('admin'), getAllEarnings);
router.patch('/:id/approve', authorize('admin'), validate(schemas.mongoIdParam, 'params'), validate(schemas.earnings.approve), idempotent(), approveEarning);
router.patch('/:id/pay', authorize('admin'), validate(schemas.mongoIdParam, 'params'), validate(schemas.earnings.pay), idempotent({ required: true }), markAsPaid);
router.patch('/bulk-approve', authorize('admin'), validate(schemas.earnings.bulkApprove), idempotent(), bulkApprove);

module.exports = router;
