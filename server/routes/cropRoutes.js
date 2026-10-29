const express = require('express');
const { body, param } = require('express-validator');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  getCrops,
  createCrop,
  getCrop,
  updateCrop,
  deleteCrop,
  addGrowthNote
} = require('../controllers/cropController');

const router = express.Router();

router.use(protect);

const cropFields = [
  body('name').optional().trim().notEmpty().withMessage('Crop name cannot be empty').isLength({ max: 80 }),
  body('season').optional().isIn(['Kharif', 'Rabi', 'Zaid', 'All year']),
  body('plantingDate').optional().isISO8601().withMessage('Planting date must be a valid date'),
  body('harvestDate').optional({ nullable: true }).isISO8601().withMessage('Harvest date must be a valid date'),
  body('status').optional().isIn(['planned', 'growing', 'harvested', 'failed']),
  body('soilHealth.ph').optional().isFloat({ min: 0, max: 14 }),
  body('soilHealth.moisture').optional().isFloat({ min: 0, max: 100 })
];

router.get('/', getCrops);

router.post(
  '/',
  [
    body('farm').isMongoId().withMessage('A valid farm is required'),
    body('name').trim().notEmpty().withMessage('Crop name is required').isLength({ max: 80 }),
    body('plantingDate').isISO8601().withMessage('Planting date is required'),
    ...cropFields
  ],
  validate,
  createCrop
);

router.get('/:id', [param('id').isMongoId()], validate, getCrop);
router.put('/:id', [param('id').isMongoId(), ...cropFields], validate, updateCrop);
router.delete('/:id', [param('id').isMongoId()], validate, deleteCrop);

router.post(
  '/:id/notes',
  [
    param('id').isMongoId(),
    body('note').trim().notEmpty().withMessage('Note is required').isLength({ max: 1000 })
  ],
  validate,
  addGrowthNote
);

module.exports = router;
