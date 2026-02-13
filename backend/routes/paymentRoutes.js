const express = require('express');
const {
    initiate,
    confirm,
    fail,
    getByBooking,
    getMyPayments,
    getAll,
    refund,
    getPayment,
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');
const { idempotent } = require('../middleware/idempotent');

const router = express.Router();

// ── All routes require authentication ─────────────────
router.use(protect);

// ── User routes ───────────────────────────────────────
router.post('/initiate', validate(schemas.payment.initiate), idempotent({ required: true }), initiate);
router.post('/confirm', validate(schemas.payment.confirm), idempotent({ required: true }), confirm);
router.post('/fail', validate(schemas.payment.fail), fail);
router.get('/my', getMyPayments);
router.get(
    '/booking/:bookingId',
    validate(schemas.payment.bookingIdParam, 'params'),
    getByBooking
);

// ── Admin routes ──────────────────────────────────────
router.get('/', authorize('admin'), getAll);
router.get('/:id', authorize('admin'), validate(schemas.mongoIdParam, 'params'), getPayment);
router.post(
    '/:id/refund',
    authorize('admin'),
    validate(schemas.mongoIdParam, 'params'),
    validate(schemas.payment.refund),
    idempotent({ required: true }),
    refund
);

module.exports = router;
