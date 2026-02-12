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

const router = express.Router();

// ── Public routes ─────────────────────────────────────
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshAccessToken);

// ── Protected routes ──────────────────────────────────
router.get('/me', protect, getMe);
router.patch('/change-password', protect, changePassword);
router.post('/logout', protect, logout);

module.exports = router;
