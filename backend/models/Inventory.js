const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add an item name'],
        trim: true,
    },
    sku: {
        type: String,
        required: [true, 'Please add a SKU'],
        unique: true,
        trim: true,
        uppercase: true,
    },
    category: {
        type: String,
        required: [true, 'Please add a category'],
        enum: ['Screen', 'Battery', 'Charging Port', 'Camera', 'Speaker', 'Motherboard', 'Other'],
        default: 'Other',
    },
    quantity: {
        type: Number,
        required: [true, 'Please add quantity'],
        min: 0,
        default: 0,
    },
    lowStockThreshold: {
        type: Number,
        default: 5,
    },
    unitPrice: {
        type: Number,
        required: [true, 'Please add unit price'],
        min: 0,
    },
    compatibility: {
        type: [String], // e.g., ["iPhone 13", "iPhone 13 Pro"]
        default: [],
    },
    lastRestockedAt: {
        type: Date,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Inventory', inventorySchema);
