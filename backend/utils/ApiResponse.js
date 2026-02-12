/**
 * Standardized API response helper
 * Ensures every response follows a consistent structure.
 */
class ApiResponse {
    constructor(statusCode, message, data = null) {
        this.success = statusCode >= 200 && statusCode < 300;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
    }

    /**
     * Send the response through Express res object
     * @param {import('express').Response} res
     */
    send(res) {
        return res.status(this.statusCode).json({
            success: this.success,
            message: this.message,
            data: this.data,
        });
    }

    // --- Static factory methods ---

    static ok(res, message = 'Success', data = null) {
        return new ApiResponse(200, message, data).send(res);
    }

    static created(res, message = 'Resource created', data = null) {
        return new ApiResponse(201, message, data).send(res);
    }

    static badRequest(res, message = 'Bad request') {
        return new ApiResponse(400, message).send(res);
    }

    static unauthorized(res, message = 'Unauthorized') {
        return new ApiResponse(401, message).send(res);
    }

    static forbidden(res, message = 'Forbidden') {
        return new ApiResponse(403, message).send(res);
    }

    static notFound(res, message = 'Resource not found') {
        return new ApiResponse(404, message).send(res);
    }

    static internal(res, message = 'Internal server error') {
        return new ApiResponse(500, message).send(res);
    }
}

module.exports = ApiResponse;
