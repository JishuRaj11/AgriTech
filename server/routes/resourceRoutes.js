const express = require('express');
const { body, param } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  getResources,
  getResource,
  createResource,
  updateResource,
  approveResource,
  deleteResource
} = require('../controllers/resourceController');

const router = express.Router();

router.use(protect);

const resourceFields = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 100 }),
  body('category').optional().isIn(['seeds', 'fertilizer', 'pesticide', 'tool', 'other']),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be 0 or more'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be 0 or more'),
  body('unit').optional().trim().isLength({ max: 30 }),
  body('isApproved').optional().isBoolean()
];

router.get('/', getResources);
router.get('/:id', [param('id').isMongoId()], validate, getResource);

router.post(
  '/',
  authorize('admin'),
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('category')
      .isIn(['seeds', 'fertilizer', 'pesticide', 'tool', 'other'])
      .withMessage('A valid category is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price is required'),
    body('stock').optional().isInt({ min: 0 }),
    ...resourceFields
  ],
  validate,
  createResource
);

router.put('/:id', authorize('admin'), [param('id').isMongoId(), ...resourceFields], validate, updateResource);
router.patch(
  '/:id/approve',
  authorize('admin'),
  [param('id').isMongoId(), body('isApproved').optional().isBoolean()],
  validate,
  approveResource
);
router.delete('/:id', authorize('admin'), [param('id').isMongoId()], validate, deleteResource);

module.exports = router;
