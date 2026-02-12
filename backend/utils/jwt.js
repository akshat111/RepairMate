const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// ═══════════════════════════════════════════════════════
// TOKEN GENERATION
// ═══════════════════════════════════════════════════════

/**
 * Generate a short-lived access token (JWT).
 * @param {string} userId
 * @returns {string}
 */
const generateAccessToken = (userId) => {
    return jwt.sign({ id: userId, type: 'access' }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    });
};

/**
 * Generate a longer-lived refresh token (JWT).
 * @param {string} userId
 * @returns {string}
 */
const generateRefreshToken = (userId) => {
    return jwt.sign(
        { id: userId, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
};

// ═══════════════════════════════════════════════════════
// COOKIE HELPERS
// ═══════════════════════════════════════════════════════

const isProduction = () => process.env.NODE_ENV === 'production';

/**
 * Secure cookie defaults shared by both token cookies.
 */
const baseCookieOptions = () => ({
    httpOnly: true,               // Not accessible via JavaScript
    secure: isProduction(),       // HTTPS-only in production
    sameSite: isProduction() ? 'strict' : 'lax',
    path: '/',
});

const accessCookieOptions = () => ({
    ...baseCookieOptions(),
    maxAge: (parseInt(process.env.JWT_ACCESS_COOKIE_MINUTES, 10) || 15) * 60 * 1000,
});

const refreshCookieOptions = () => ({
    ...baseCookieOptions(),
    maxAge: (parseInt(process.env.JWT_REFRESH_COOKIE_DAYS, 10) || 7) * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth',          // Only sent to auth routes
});

// ═══════════════════════════════════════════════════════
// RESPONSE SENDER
// ═══════════════════════════════════════════════════════

/**
 * Generate both tokens, set cookies, and send JSON response.
 * Also stores a hashed version of the refresh token on the user document.
 *
 * @param {Object} user - Mongoose user document
 * @param {number} statusCode
 * @param {import('express').Response} res
 */
const sendTokenResponse = async (user, statusCode, res) => {
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Store hashed refresh token in DB for validation on /refresh
    user.refreshToken = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');
    await user.save({ validateBeforeSave: false });

    res
        .status(statusCode)
        .cookie('accessToken', accessToken, accessCookieOptions())
        .cookie('refreshToken', refreshToken, refreshCookieOptions())
        .json({
            success: true,
            message: statusCode === 201 ? 'Registration successful' : 'Login successful',
            accessToken,
            data: { user },
        });
};

/**
 * Clear both token cookies (used on logout).
 */
const clearTokenCookies = (res) => {
    res.cookie('accessToken', '', { ...baseCookieOptions(), maxAge: 0 });
    res.cookie('refreshToken', '', { ...baseCookieOptions(), maxAge: 0, path: '/api/v1/auth' });
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    sendTokenResponse,
    clearTokenCookies,
    baseCookieOptions,
};
