const AppError = require('../utils/AppError');

/**
 * Generic Joi validation middleware factory.
 *
 * Returns middleware that validates `req[source]` against the given Joi schema.
 * If validation fails, a 400 AppError is thrown with all messages joined.
 *
 * @param {import('joi').ObjectSchema} schema - Joi schema to validate against
 * @param {'body'|'params'|'query'} source  - Which part of the request to validate
 * @returns {import('express').RequestHandler}
 *
 * Usage:
 *   router.post('/', validate(bookingCreateSchema), controller);
 *   router.get('/:id', validate(mongoIdSchema, 'params'), controller);
 */
const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[source], {
            abortEarly: false,      // Collect all errors, not just the first
            stripUnknown: true,     // Remove fields not in the schema
            convert: true,          // Auto-coerce types (e.g. string → number)
        });

        if (error) {
            const messages = error.details.map((d) => d.message.replace(/"/g, ''));
            throw new AppError(messages.join('. '), 400);
        }

        // Replace with sanitized + coerced values
        req[source] = value;
        next();
    };
};

module.exports = validate;
