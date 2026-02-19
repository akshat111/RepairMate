const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const getCustomers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search } = req.query;

    const filter = { role: 'user' };

    // Optional search by name or email
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
        ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [customers, total] = await Promise.all([
        User.find(filter)
            .select('name email phone avatar isActive createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit, 10)),
        User.countDocuments(filter),
    ]);

    res.status(200).json({
        success: true,
        count: customers.length,
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
        data: { customers },
    });
});

/**
 * @desc    Delete a customer
 * @route   DELETE /api/v1/admin/customers/:id
 * @access  Private (admin)
 */
const deleteCustomer = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user.role !== 'user') {
        res.status(400);
        throw new Error('Can only delete customers');
    }

    await user.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Customer deleted successfully',
    });
});

module.exports = { getCustomers, deleteCustomer };
