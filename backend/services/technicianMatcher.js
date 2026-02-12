const Technician = require('../models/Technician');

// ═══════════════════════════════════════════════════════
// TECHNICIAN MATCHING ENGINE
// ═══════════════════════════════════════════════════════
//
// Finds the best available technician for a given job
// based on service type, availability, and a scoring
// system that ranks by rating + experience.
//
// Designed as a standalone service so it can be reused
// by booking creation, admin dashboard, and cron jobs.
// ═══════════════════════════════════════════════════════

/**
 * Scoring weights for ranking matched technicians.
 * Adjust these to tune the matching algorithm.
 */
const WEIGHTS = {
    rating: 0.5,           // averageRating (0–5)
    experience: 0.2,       // experienceYears (capped at 20)
    completions: 0.2,      // completedRepairs (capped at 200)
    reviewCount: 0.1,      // totalReviews (capped at 100)
};

/**
 * Normalize a value to 0–1 range.
 */
const normalize = (value, max) => Math.min(value / max, 1);

/**
 * Compute a match score (0–1) for a technician.
 */
const computeScore = (tech) => {
    return (
        WEIGHTS.rating * normalize(tech.averageRating || 0, 5) +
        WEIGHTS.experience * normalize(tech.experienceYears || 0, 20) +
        WEIGHTS.completions * normalize(tech.completedRepairs || 0, 200) +
        WEIGHTS.reviewCount * normalize(tech.totalReviews || 0, 100)
    );
};

/**
 * Find matching technicians for a service type.
 *
 * Filter criteria (all must be true):
 *   1. verificationStatus === 'approved'
 *   2. isAvailable === true
 *   3. isOnline === true
 *   4. specializations array includes the serviceType (case-insensitive)
 *
 * @param {Object}  options
 * @param {string}  options.serviceType   - Required. The service being requested.
 * @param {Object}  [options.location]    - Optional. { lng, lat } for geo-based proximity.
 * @param {number}  [options.maxDistance] - Optional. Max distance in meters (default: 50km).
 * @param {number}  [options.limit]       - Optional. Max results to return (default: 5).
 * @returns {Promise<Array>} Sorted array of { technician, score } objects.
 */
const findMatchingTechnicians = async ({
    serviceType,
    location = null,
    maxDistance = 50000,
    limit = 5,
}) => {
    // ── Build the query filter ─────────────────────────
    const filter = {
        verificationStatus: 'approved',
        isAvailable: true,
        isOnline: true,
    };

    // Case-insensitive specialization match
    filter.specializations = {
        $elemMatch: { $regex: new RegExp(`^${escapeRegex(serviceType)}$`, 'i') },
    };

    // Optional geo-proximity filter
    if (location && location.lng != null && location.lat != null) {
        filter.location = {
            $near: {
                $geometry: { type: 'Point', coordinates: [location.lng, location.lat] },
                $maxDistance: maxDistance,
            },
        };
    }

    // ── Query the database ─────────────────────────────
    const technicians = await Technician.find(filter)
        .populate('user', 'name email phone avatar')
        .lean();

    // ── Score and rank ─────────────────────────────────
    const scored = technicians.map((tech) => ({
        technician: tech,
        score: computeScore(tech),
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit);
};

/**
 * Pick the single best technician for auto-assignment.
 * Returns the technician document or null if none found.
 *
 * @param {Object} options - Same as findMatchingTechnicians
 * @returns {Promise<Object|null>}
 */
const findBestMatch = async (options) => {
    const matches = await findMatchingTechnicians({ ...options, limit: 1 });
    return matches.length > 0 ? matches[0].technician : null;
};

/**
 * Escape special regex characters in a string.
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = {
    findMatchingTechnicians,
    findBestMatch,
    computeScore,
    WEIGHTS,
};
