const express = require('express');
const {
    getAllItems,
    getItem,
    createItem,
    updateItem,
    deleteItem,
} = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All inventory routes are protected
router.use(protect);

router
    .route('/')
    .get(authorize('admin', 'technician'), getAllItems)
    .post(authorize('admin'), createItem);

router
    .route('/:id')
    .get(authorize('admin', 'technician'), getItem)
    .patch(authorize('admin'), updateItem)
    .delete(authorize('admin'), deleteItem);

module.exports = router;
