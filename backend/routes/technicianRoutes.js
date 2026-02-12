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
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = express.Router();

// All routes require authentication
router.use(protect);

// ── Technician self-service routes ────────────────────
router.post('/register', validate(schemas.technician.register), registerTechnician);
router.get('/me', getMyProfile);
router.put('/me', validate(schemas.technician.update), updateMyProfile);

// ── Admin-only routes ─────────────────────────────────
router.get('/', authorize('admin'), validate(schemas.technician.query, 'query'), getAllTechnicians);
router.get('/:id', authorize('admin'), validate(schemas.mongoIdParam, 'params'), getTechnician);
router.patch('/:id/approve', authorize('admin'), validate(schemas.mongoIdParam, 'params'), approveTechnician);
router.patch(
    '/:id/reject',
    authorize('admin'),
    validate(schemas.mongoIdParam, 'params'),
    validate(schemas.technician.reject),
    rejectTechnician
);

module.exports = router;
