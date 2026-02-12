const Joi = require('joi');

// ── Shared helpers ────────────────────────────────────
const objectId = Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .message('{{#label}} must be a valid MongoDB ObjectId');

const mongoIdParam = Joi.object({
    id: objectId.required().label('Resource ID'),
});

// ═══════════════════════════════════════════════════════
// BOOKING SCHEMAS
// ═══════════════════════════════════════════════════════

const createBooking = Joi.object({
    serviceType: Joi.string().trim().max(100).required()
        .label('Service type'),

    description: Joi.string().trim().max(1000).required()
        .label('Description'),

    deviceInfo: Joi.object({
        brand: Joi.string().trim().allow(''),
        model: Joi.string().trim().allow(''),
        issue: Joi.string().trim().allow(''),
    }).optional(),

    preferredDate: Joi.date().iso().greater('now').required()
        .label('Preferred date')
        .messages({ 'date.greater': 'Preferred date must be in the future' }),

    preferredTimeSlot: Joi.string()
        .valid('morning', 'afternoon', 'evening')
        .default('morning')
        .label('Time slot'),

    address: Joi.object({
        street: Joi.string().trim().allow(''),
        city: Joi.string().trim().allow(''),
        state: Joi.string().trim().allow(''),
        zipCode: Joi.string().trim().allow(''),
    }).optional(),

    notes: Joi.string().trim().max(2000).allow('').optional()
        .label('Notes'),

    estimatedCost: Joi.number().min(0).optional()
        .label('Estimated cost'),
});

const cancelBooking = Joi.object({
    reason: Joi.string().trim().max(500).optional()
        .label('Cancellation reason'),
});

const completeBooking = Joi.object({
    finalCost: Joi.number().min(0).optional()
        .label('Final cost'),
    notes: Joi.string().trim().max(2000).allow('').optional()
        .label('Notes'),
});

const assignTechnician = Joi.object({
    technicianId: objectId.required()
        .label('Technician ID'),
});

const updateStatus = Joi.object({
    status: Joi.string()
        .valid('pending', 'assigned', 'in_progress', 'completed', 'cancelled')
        .required()
        .label('Status'),
    notes: Joi.string().trim().max(2000).allow('').optional()
        .label('Notes'),
    cancellationReason: Joi.string().trim().max(500).allow('').optional()
        .label('Cancellation reason'),
});

const bookingQuery = Joi.object({
    status: Joi.string()
        .valid('pending', 'assigned', 'in_progress', 'completed', 'cancelled')
        .optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    user: objectId.optional(),
    technician: objectId.optional(),
});

// ═══════════════════════════════════════════════════════
// TECHNICIAN SCHEMAS
// ═══════════════════════════════════════════════════════

const registerTechnician = Joi.object({
    specializations: Joi.array()
        .items(Joi.string().trim())
        .min(1)
        .required()
        .label('Specializations'),

    experienceYears: Joi.number()
        .integer().min(0).max(50)
        .required()
        .label('Experience years'),

    certifications: Joi.array().items(
        Joi.object({
            name: Joi.string().trim().required(),
            issuedBy: Joi.string().trim().allow(''),
            year: Joi.number().integer().min(1950).max(new Date().getFullYear()),
        })
    ).optional(),

    serviceArea: Joi.string().trim().max(100).optional()
        .label('Service area'),

    hourlyRate: Joi.number().min(0).optional()
        .label('Hourly rate'),
});

const updateTechnician = Joi.object({
    specializations: Joi.array()
        .items(Joi.string().trim())
        .min(1)
        .optional()
        .label('Specializations'),

    experienceYears: Joi.number()
        .integer().min(0).max(50)
        .optional()
        .label('Experience years'),

    certifications: Joi.array().items(
        Joi.object({
            name: Joi.string().trim().required(),
            issuedBy: Joi.string().trim().allow(''),
            year: Joi.number().integer().min(1950).max(new Date().getFullYear()),
        })
    ).optional(),

    serviceArea: Joi.string().trim().max(100).optional()
        .label('Service area'),

    hourlyRate: Joi.number().min(0).optional()
        .label('Hourly rate'),

    isAvailable: Joi.boolean().optional(),

    isOnline: Joi.boolean().optional(),

    location: Joi.object({
        type: Joi.string().valid('Point').required(),
        coordinates: Joi.array().items(Joi.number()).length(2).required(),
    }).optional(),
}).min(1).messages({ 'object.min': 'At least one field is required to update' });

const rejectTechnician = Joi.object({
    reason: Joi.string().trim().max(500).required()
        .label('Rejection reason'),
});

const technicianQuery = Joi.object({
    status: Joi.string()
        .valid('pending', 'approved', 'rejected')
        .optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
});

// ═══════════════════════════════════════════════════════
// AUTH SCHEMAS
// ═══════════════════════════════════════════════════════

const authRegister = Joi.object({
    name: Joi.string().trim().max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    phone: Joi.string().pattern(/^\+?[\d\s-]{7,15}$/).optional()
        .label('Phone')
        .messages({ 'string.pattern.base': 'Phone must be a valid phone number' }),
});

const authLogin = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

const changePassword = Joi.object({
    currentPassword: Joi.string().required().label('Current password'),
    newPassword: Joi.string().min(8).required().label('New password')
        .disallow(Joi.ref('currentPassword'))
        .messages({ 'any.invalid': 'New password must be different from current password' }),
});

module.exports = {
    mongoIdParam,
    booking: {
        create: createBooking,
        cancel: cancelBooking,
        complete: completeBooking,
        assign: assignTechnician,
        updateStatus,
        query: bookingQuery,
    },
    technician: {
        register: registerTechnician,
        update: updateTechnician,
        reject: rejectTechnician,
        query: technicianQuery,
    },
    auth: {
        register: authRegister,
        login: authLogin,
        changePassword,
    },
};
