const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ── User Schema ───────────────────────────────────────
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            maxlength: [50, 'Name cannot exceed 50 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Please provide a valid email',
            ],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters'],
            select: false,
        },
        phone: {
            type: String,
            trim: true,
            match: [/^\+?[\d\s-]{7,15}$/, 'Please provide a valid phone number'],
        },
        avatar: {
            type: String,
            default: '',
        },
        role: {
            type: String,
            enum: ['user', 'technician', 'admin'],
            default: 'user',
        },
        isActive: {
            type: Boolean,
            default: true,
        },

        // ── Security fields ─────────────────────────────────
        refreshToken: {
            type: String,
            select: false,
        },
        passwordChangedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// ── Hash password before saving ───────────────────────
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);

    // Track when the password was last changed (skip first creation)
    if (!this.isNew) {
        this.passwordChangedAt = new Date(Date.now() - 1000); // subtract 1s to ensure token iat < changedAt
    }

    next();
});

// ── Instance: compare candidate password ──────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// ── Instance: check if password changed after token issued ──
userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
    if (this.passwordChangedAt) {
        const changedAt = Math.floor(this.passwordChangedAt.getTime() / 1000);
        return jwtTimestamp < changedAt;
    }
    return false;
};

// ── Strip sensitive fields from JSON output ───────────
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.refreshToken;
    delete obj.__v;
    return obj;
};

module.exports = mongoose.model('User', userSchema);
