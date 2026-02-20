const asyncHandler = require('../utils/asyncHandler');
const Inventory = require('../models/Inventory');
const AppError = require('../utils/AppError');

// @desc    Get all inventory items
// @route   GET /api/v1/inventory
// @access  Private (Admin)
exports.getAllItems = asyncHandler(async (req, res, next) => {
    const items = await Inventory.find().sort({ name: 1 });

    res.status(200).json({
        success: true,
        count: items.length,
        data: items,
    });
});

// @desc    Get single inventory item
// @route   GET /api/v1/inventory/:id
// @access  Private (Admin)
exports.getItem = asyncHandler(async (req, res, next) => {
    const item = await Inventory.findById(req.params.id);

    if (!item) {
        return next(new AppError('Item not found', 404));
    }

    res.status(200).json({
        success: true,
        data: item,
    });
});

// @desc    Create new inventory item
// @route   POST /api/v1/inventory
// @access  Private (Admin)
exports.createItem = asyncHandler(async (req, res, next) => {
    const item = await Inventory.create(req.body);

    res.status(201).json({
        success: true,
        data: item,
    });
});

// @desc    Update inventory item
// @route   PATCH /api/v1/inventory/:id
// @access  Private (Admin)
exports.updateItem = asyncHandler(async (req, res, next) => {
    let item = await Inventory.findById(req.params.id);

    if (!item) {
        return next(new AppError('Item not found', 404));
    }

    item = await Inventory.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        success: true,
        data: item,
    });
});

// @desc    Delete inventory item
// @route   DELETE /api/v1/inventory/:id
// @access  Private (Admin)
exports.deleteItem = asyncHandler(async (req, res, next) => {
    const item = await Inventory.findById(req.params.id);

    if (!item) {
        return next(new AppError('Item not found', 404));
    }

    await item.deleteOne();

    res.status(200).json({
        success: true,
        data: {},
    });
});
