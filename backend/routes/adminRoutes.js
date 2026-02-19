const express = require('express');
const { getCustomers, deleteCustomer } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// ── All admin routes require authentication + admin role ──
router.use(protect, authorize('admin'));

router.get('/customers', getCustomers);
router.delete('/customers/:id', deleteCustomer);

module.exports = router;
