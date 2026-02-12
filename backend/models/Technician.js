const mongoose = require('mongoose');

// ── Technician Schema ─────────────────────────────────
const technicianSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Technician must be linked to a user account'],
            unique: true,
        },

        // ── Professional info ─────────────────────────────
        specializations: {
            type: [String],
            required: [true, 'At least one specialization is required'],
            validate: {
                validator: (arr) => arr.length > 0,
                message: 'Provide at least one specialization',
            },
        },
        experienceYears: {
            type: Number,
            required: [true, 'Years of experience is required'],
            min: [0, 'Experience cannot be negative'],
            max: [50, 'Experience cannot exceed 50 years'],
        },
        certifications: [
            {
                name: { type: String, trim: true },
                issuedBy: { type: String, trim: true },
                year: { type: Number },
            },
        ],

        // ── Availability & location ───────────────────────
        isAvailable: {
            type: Boolean,
            default: true,
        },
        serviceArea: {
            type: String,
            trim: true,
            maxlength: [100, 'Service area cannot exceed 100 characters'],
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
            },
        },

        // ── Ratings & performance ─────────────────────────
        averageRating: {
            type: Number,
            default: 0,
            min: [0, 'Rating cannot be below 0'],
            max: [5, 'Rating cannot exceed 5'],
        },
        totalReviews: {
            type: Number,
            default: 0,
        },
        completedRepairs: {
            type: Number,
            default: 0,
        },

        // ── Pricing ───────────────────────────────────────
        hourlyRate: {
            type: Number,
            min: [0, 'Hourly rate cannot be negative'],
        },

        // ── Verification status ───────────────────────────
        isVerified: {
            type: Boolean,
            default: false,
        },
        verifiedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// ── Indexes ───────────────────────────────────────────
technicianSchema.index({ specializations: 1 });
technicianSchema.index({ isAvailable: 1, isVerified: 1 });
technicianSchema.index({ location: '2dsphere' }); // Geo queries (nearby technicians)

// ── Virtual: populate user details ────────────────────
technicianSchema.virtual('profile', {
    ref: 'User',
    localField: 'user',
    foreignField: '_id',
    justOne: true,
});

// Ensure virtuals are included in JSON & Object output
technicianSchema.set('toJSON', { virtuals: true });
technicianSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Technician', technicianSchema);
