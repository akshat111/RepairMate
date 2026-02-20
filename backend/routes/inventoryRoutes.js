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

// All inventory routes are protected and restricted to admin
router.use(protect);
router.use(authorize('admin'));

router
    .route('/')
    .get(getAllItems)
    .post(createItem);

router
    .route('/:id')
    .get(getItem)
    .patch(updateItem)
    .delete(deleteItem);

module.exports = router;
