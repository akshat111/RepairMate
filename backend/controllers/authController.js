const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const {
    sendTokenResponse,
    generateAccessToken,
    clearTokenCookies,
} = require('../utils/jwt');

// ═══════════════════════════════════════════════════════
// PUBLIC ENDPOINTS
// ═══════════════════════════════════════════════════════

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
        throw new AppError('Name, email, and password are required', 400);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new AppError('An account with this email already exists', 400);
    }

    const user = await User.create({ name, email, password, phone });

    await sendTokenResponse(user, 201, res);
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new AppError('Please provide email and password', 400);
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
        throw new AppError('This account has been deactivated. Contact support.', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new AppError('Invalid email or password', 401);
    }

    await sendTokenResponse(user, 200, res);
});

/**
 * @desc    Refresh the access token using a valid refresh token
 * @route   POST /api/v1/auth/refresh
 * @access  Public (requires valid refresh token cookie or body)
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
    // 1. Get refresh token from cookie or body
    let refreshToken;
    if (req.cookies && req.cookies.refreshToken) {
        refreshToken = req.cookies.refreshToken;
    } else if (req.body.refreshToken) {
        refreshToken = req.body.refreshToken;
    }

    if (!refreshToken) {
        throw new AppError('No refresh token provided', 401);
    }

    // 2. Verify the refresh token
    let decoded;
    try {
        decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
        );
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            throw new AppError('Refresh token expired. Please log in again.', 401);
        }
        throw new AppError('Invalid refresh token.', 401);
    }

    if (decoded.type !== 'refresh') {
        throw new AppError('Invalid token type.', 401);
    }

    // 3. Find the user and compare stored hash
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user) {
        throw new AppError('User no longer exists.', 401);
    }
    if (!user.isActive) {
        throw new AppError('Account deactivated.', 401);
    }

    const tokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

    if (!user.refreshToken || user.refreshToken !== tokenHash) {
        // Token reuse detected — clear stored refresh token (rotate strategy)
        user.refreshToken = undefined;
        await user.save({ validateBeforeSave: false });
        throw new AppError('Refresh token invalid or reused. Please log in again.', 401);
    }

    // 4. Issue new access token (refresh token stays the same until login/logout)
    const accessToken = generateAccessToken(user._id);

    const accessCookieMaxAge =
        (parseInt(process.env.JWT_ACCESS_COOKIE_MINUTES, 10) || 15) * 60 * 1000;

    res
        .status(200)
        .cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: accessCookieMaxAge,
            path: '/',
        })
        .json({
            success: true,
            message: 'Token refreshed successfully',
            accessToken,
        });
});

// ═══════════════════════════════════════════════════════
// PROTECTED ENDPOINTS
// ═══════════════════════════════════════════════════════

/**
 * @desc    Get current logged-in user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        data: { user: req.user },
    });
});

/**
 * @desc    Change password
 * @route   PATCH /api/v1/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        throw new AppError('Current password and new password are required', 400);
    }

    if (newPassword.length < 8) {
        throw new AppError('New password must be at least 8 characters', 400);
    }

    if (currentPassword === newPassword) {
        throw new AppError('New password must be different from current password', 400);
    }

    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        throw new AppError('Current password is incorrect', 401);
    }

    user.password = newPassword; // Will be hashed by pre-save hook
    await user.save();           // Also sets passwordChangedAt

    // Issue fresh tokens since old ones are now invalid
    await sendTokenResponse(user, 200, res);
});

/**
 * @desc    Logout — clear all token cookies and revoke refresh token
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
    // Revoke refresh token in DB
    await User.findByIdAndUpdate(req.user._id, { refreshToken: undefined });

    // Clear cookies
    clearTokenCookies(res);

    res.status(200).json({
        success: true,
        message: 'Logged out successfully',
    });
});

module.exports = {
    register,
    login,
    refreshAccessToken,
    getMe,
    changePassword,
    logout,
};
