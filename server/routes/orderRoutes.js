const express = require('express');
const { body, param } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder
} = require('../controllers/orderController');

const router = express.Router();

router.use(protect);

router.get('/', getOrders);
router.get('/:id', [param('id').isMongoId()], validate, getOrder);

router.post(
  '/',
  authorize('farmer'),
  [
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.resource').isMongoId().withMessage('Each item needs a valid resource'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('deliveryAddress').trim().notEmpty().withMessage('Delivery address is required').isLength({ max: 300 })
  ],
  validate,
  createOrder
);

router.patch(
  '/:id/status',
  authorize('admin'),
  [
    param('id').isMongoId(),
    body('status')
      .isIn(['pending', 'approved', 'delivered', 'rejected', 'cancelled'])
      .withMessage('Invalid order status')
  ],
  validate,
  updateOrderStatus
);

router.patch('/:id/cancel', [param('id').isMongoId()], validate, cancelOrder);

module.exports = router;
