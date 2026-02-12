const express = require('express');
const {
    register,
    login,
    refreshAccessToken,
    getMe,
    changePassword,
    logout,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

const router = express.Router();

// ── Public routes ─────────────────────────────────────
router.post('/register', validate(schemas.auth.register), register);
router.post('/login', validate(schemas.auth.login), login);
router.post('/refresh', refreshAccessToken);

// ── Protected routes ──────────────────────────────────
router.get('/me', protect, getMe);
router.patch('/change-password', protect, validate(schemas.auth.changePassword), changePassword);
router.post('/logout', protect, logout);

module.exports = router;
