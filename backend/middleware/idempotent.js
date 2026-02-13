const IdempotencyKey = require('../models/IdempotencyKey');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// ═══════════════════════════════════════════════════════
// IDEMPOTENCY MIDDLEWARE
// ═══════════════════════════════════════════════════════
//
// Prevents duplicate processing of sensitive operations.
//
// Usage:
//   router.post('/create', idempotent(), controller)
//   router.post('/create', idempotent({ required: true }), controller)
//
// Client sends:  Idempotency-Key: <unique-string>
// Server checks: Has this key been seen before for this user?
//   - NEW key       → process request, cache response
//   - COMPLETED key → return cached response (no re-processing)
//   - PROCESSING    → return 409 (request in flight)
//
// If no key is provided and required=false, request proceeds
// normally without idempotency protection.
// ═══════════════════════════════════════════════════════

/**
 * Create idempotency middleware.
 *
 * @param {Object}  [opts]
 * @param {boolean} [opts.required=false] - If true, reject requests without a key
 * @returns {Function} Express middleware
 */
const idempotent = (opts = {}) => {
    const { required = false } = opts;

    return async (req, res, next) => {
        const idempotencyKey = req.headers['idempotency-key'];

        // No key provided
        if (!idempotencyKey) {
            if (required) {
                return next(
                    new AppError(
                        'Idempotency-Key header is required for this operation',
                        400
                    )
                );
            }
            // Optional — proceed without idempotency
            return next();
        }

        // Validate key format
        if (idempotencyKey.length > 255) {
            return next(new AppError('Idempotency-Key must be 255 characters or fewer', 400));
        }

        const userId = req.user?._id;
        if (!userId) {
            return next(new AppError('Authentication required for idempotent requests', 401));
        }

        try {
            // ── Attempt atomic insert (claim the key) ─────────
            const existing = await IdempotencyKey.findOneAndUpdate(
                { key: idempotencyKey, user: userId },
                {
                    $setOnInsert: {
                        key: idempotencyKey,
                        user: userId,
                        method: req.method,
                        path: req.originalUrl,
                        status: 'processing',
                    },
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            // If the record was already there (not a fresh insert)
            const isNew = existing.status === 'processing' &&
                Math.abs(existing.createdAt.getTime() - existing.updatedAt.getTime()) < 1000;

            if (!isNew) {
                // ── Already processed: return cached response ───
                if (existing.status === 'completed') {
                    // Validate method + path match
                    if (existing.method !== req.method || existing.path !== req.originalUrl) {
                        return next(
                            new AppError(
                                'Idempotency-Key was used with a different request. Each key must be unique per endpoint.',
                                422
                            )
                        );
                    }

                    res.setHeader('Idempotent-Replayed', 'true');
                    return res.status(existing.statusCode).json(existing.responseBody);
                }

                // ── Still processing (concurrent duplicate) ─────
                if (existing.status === 'processing') {
                    return next(
                        new AppError(
                            'A request with this idempotency key is currently being processed. Please wait.',
                            409
                        )
                    );
                }

                // ── Previous attempt errored — allow retry ──────
                if (existing.status === 'error') {
                    // Reset to processing for retry
                    await IdempotencyKey.findOneAndUpdate(
                        { key: idempotencyKey, user: userId, status: 'error' },
                        { $set: { status: 'processing', method: req.method, path: req.originalUrl } }
                    );
                }
            }

            // ── Intercept response to cache it ────────────────
            const originalJson = res.json.bind(res);
            res.json = async function (body) {
                try {
                    await IdempotencyKey.findOneAndUpdate(
                        { key: idempotencyKey, user: userId },
                        {
                            $set: {
                                status: 'completed',
                                statusCode: res.statusCode,
                                responseBody: body,
                            },
                        }
                    );
                } catch (cacheErr) {
                    logger.warn('Failed to cache idempotent response', { error: cacheErr.message });
                }
                return originalJson(body);
            };

            // Store key reference on request for error handling
            req._idempotencyKey = idempotencyKey;
            req._idempotencyUserId = userId;

            next();
        } catch (err) {
            // Handle duplicate key race (E11000)
            if (err.code === 11000) {
                return next(
                    new AppError(
                        'A request with this idempotency key is currently being processed. Please wait.',
                        409
                    )
                );
            }
            next(err);
        }
    };
};

/**
 * Mark an idempotency key as errored (call from error handler).
 * Allows the client to retry with the same key.
 */
const markIdempotencyError = async (req, errorMessage) => {
    if (!req._idempotencyKey || !req._idempotencyUserId) return;

    try {
        await IdempotencyKey.findOneAndUpdate(
            { key: req._idempotencyKey, user: req._idempotencyUserId },
            {
                $set: {
                    status: 'error',
                    errorMessage: errorMessage || 'Request processing failed',
                },
            }
        );
    } catch (err) {
        logger.warn('Failed to mark idempotency key as error', { error: err.message });
    }
};

module.exports = { idempotent, markIdempotencyError };
