const express = require('express');
const {
    registerTechnician,
    getMyProfile,
    updateMyProfile,
    getAllTechnicians,
    getTechnician,
    approveTechnician,
    rejectTechnician,
} = require('../controllers/technicianController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// ── Technician self-service routes ────────────────────
router.post('/register', registerTechnician);
router.get('/me', getMyProfile);
router.put('/me', updateMyProfile);

// ── Admin-only routes ─────────────────────────────────
router.get('/', authorize('admin'), getAllTechnicians);
router.get('/:id', authorize('admin'), getTechnician);
router.patch('/:id/approve', authorize('admin'), approveTechnician);
router.patch('/:id/reject', authorize('admin'), rejectTechnician);

module.exports = router;
