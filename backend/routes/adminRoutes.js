const express = require('express');
const {
    getCustomers,
    deleteCustomer,
    getTechnicians,
    deleteTechnician,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// ── All admin routes require authentication + admin role ──
router.use(protect, authorize('admin'));

// Customer management
router.get('/customers', getCustomers);
router.delete('/customers/:id', deleteCustomer);

// Technician management
router.get('/technicians', getTechnicians);
router.delete('/technicians/:id', deleteTechnician);

module.exports = router;

