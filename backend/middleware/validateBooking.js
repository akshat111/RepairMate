const AppError = require('../utils/AppError');

/**
 * Validate required fields for booking creation.
 * Runs before the controller to ensure clean input.
 */
const validateBookingCreate = (req, res, next) => {
    const { serviceType, description, preferredDate } = req.body;
    const errors = [];

    if (!serviceType || !serviceType.trim()) {
        errors.push('Service type is required');
    }
    if (!description || !description.trim()) {
        errors.push('Description is required');
    }
    if (!preferredDate) {
        errors.push('Preferred date is required');
    } else {
        const date = new Date(preferredDate);
        if (isNaN(date.getTime())) {
            errors.push('Preferred date is not a valid date');
        } else if (date < new Date()) {
            errors.push('Preferred date must be in the future');
        }
    }

    if (req.body.preferredTimeSlot) {
        const validSlots = ['morning', 'afternoon', 'evening'];
        if (!validSlots.includes(req.body.preferredTimeSlot)) {
            errors.push(`Time slot must be one of: ${validSlots.join(', ')}`);
        }
    }

    if (errors.length > 0) {
        throw new AppError(errors.join('. '), 400);
    }

    next();
};

/**
 * Validate status transition request body.
 */
const validateStatusUpdate = (req, res, next) => {
    const { status } = req.body;

    if (!status) {
        throw new AppError('Status is required', 400);
    }

    const validStatuses = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
        throw new AppError(`Invalid status '${status}'. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    next();
};

/**
 * Validate technician assignment request body.
 */
const validateAssignment = (req, res, next) => {
    const { technicianId } = req.body;

    if (!technicianId) {
        throw new AppError('Technician ID is required', 400);
    }

    // Basic ObjectId format check (24 hex characters)
    if (!/^[0-9a-fA-F]{24}$/.test(technicianId)) {
        throw new AppError('Invalid technician ID format', 400);
    }

    next();
};

module.exports = {
    validateBookingCreate,
    validateStatusUpdate,
    validateAssignment,
};
