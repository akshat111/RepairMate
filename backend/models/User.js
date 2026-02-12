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
            minlength: [6, 'Password must be at least 6 characters'],
            select: false, // Never return password in queries by default
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
    },
    {
        timestamps: true,
    }
);

// ── Hash password before saving ───────────────────────
userSchema.pre('save', async function (next) {
    // Only hash if the password field was modified
    if (!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// ── Instance method: compare candidate password ──────
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// ── Strip password from JSON output ───────────────────
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

module.exports = mongoose.model('User', userSchema);

