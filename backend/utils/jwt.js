const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT for a given user ID.
 * @param {string} userId - MongoDB ObjectId of the user
 * @returns {string} Signed JWT
 */
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

/**
 * Build and send a token response with an HTTP-only cookie.
 * @param {Object} user   - Mongoose user document
 * @param {number} statusCode
 * @param {import('express').Response} res
 */
const sendTokenResponse = (user, statusCode, res) => {
    const token = generateToken(user._id);

    const cookieOptions = {
        expires: new Date(
            Date.now() +
            (parseInt(process.env.JWT_COOKIE_EXPIRES_IN, 10) || 7) *
            24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    };

    res
        .status(statusCode)
        .cookie('token', token, cookieOptions)
        .json({
            success: true,
            message: statusCode === 201 ? 'Registration successful' : 'Login successful',
            token,
            data: { user },
        });
};

module.exports = { generateToken, sendTokenResponse };
