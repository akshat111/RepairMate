const express = require('express');
const {
    getServicePricing,
    getAllRules,
    createRule,
    updateRule,
    deleteRule,
    seedDefaults,
} = require('../controllers/pricingController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = express.Router();

// ── Public route ──────────────────────────────────────
router.get('/:serviceType', getServicePricing);

// ── Admin routes (protected) ──────────────────────────
router.use(protect, authorize('admin'));

router.get('/', getAllRules);
router.post('/', validate(schemas.pricing.create), createRule);
router.post('/seed', seedDefaults);
router.put('/:id', validate(schemas.mongoIdParam, 'params'), validate(schemas.pricing.update), updateRule);
router.delete('/:id', validate(schemas.mongoIdParam, 'params'), deleteRule);

module.exports = router;
