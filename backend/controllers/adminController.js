const User = require('../models/User');
const Technician = require('../models/Technician');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get all customers
 * @route   GET /api/v1/admin/customers
 * @access  Private (admin)
 */
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

/**
 * @desc    Get all technicians
 * @route   GET /api/v1/admin/technicians
 * @access  Private (admin)
 */
const getTechnicians = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search, status } = req.query;

    const filter = {};
    if (status) filter.verificationStatus = status;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    // If searching, we search by name/email in User model first
    let userFilter = { role: 'technician' };
    if (search) {
        userFilter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
        ];
    }

    // Find technicians and populate user info
    const [technicians, total] = await Promise.all([
        Technician.find(filter)
            .populate({
                path: 'user',
                match: search ? userFilter : { role: 'technician' },
                select: 'name email phone avatar isActive',
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit, 10)),
        Technician.countDocuments(filter),
    ]);

    // Filter out technicians where user match failed (if search was applied)
    const filteredTechnicians = technicians.filter((t) => t.user !== null);

    res.status(200).json({
        success: true,
        count: filteredTechnicians.length,
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
        data: { technicians: filteredTechnicians },
    });
});

/**
 * @desc    Delete a technician
 * @route   DELETE /api/v1/admin/technicians/:id
 * @access  Private (admin)
 */
const deleteTechnician = asyncHandler(async (req, res) => {
    const technician = await Technician.findById(req.params.id);

    if (!technician) {
        res.status(404);
        throw new Error('Technician record not found');
    }

    // Delete both Technician and User records
    const userId = technician.user;
    await Promise.all([technician.deleteOne(), User.findByIdAndDelete(userId)]);

    res.status(200).json({
        success: true,
        message: 'Technician and associated user account deleted successfully',
    });
});

module.exports = {
    getCustomers,
    deleteCustomer,
    getTechnicians,
    deleteTechnician,
};

