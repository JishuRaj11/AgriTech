const express = require('express');
const { body, param } = require('express-validator');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  getFarms,
  createFarm,
  getFarm,
  updateFarm,
  deleteFarm,
  addActivityLog
} = require('../controllers/farmController');

const router = express.Router();

router.use(protect);

const farmFields = [
  body('name').optional().trim().notEmpty().withMessage('Farm name cannot be empty').isLength({ max: 100 }),
  body('location').optional().trim().notEmpty().withMessage('Location cannot be empty').isLength({ max: 150 }),
  body('size').optional().isFloat({ gt: 0 }).withMessage('Size must be greater than 0'),
  body('sizeUnit').optional().isIn(['acre', 'hectare']),
  body('soilType').optional().isIn(['clay', 'sandy', 'loamy', 'silt', 'peaty', 'chalky', 'other']),
  body('notes').optional().trim().isLength({ max: 1000 })
];

router.get('/', getFarms);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Farm name is required').isLength({ max: 100 }),
    body('location').trim().notEmpty().withMessage('Location is required').isLength({ max: 150 }),
    body('size').isFloat({ gt: 0 }).withMessage('Size must be greater than 0'),
    ...farmFields
  ],
  validate,
  createFarm
);

router.get('/:id', [param('id').isMongoId()], validate, getFarm);
router.put('/:id', [param('id').isMongoId(), ...farmFields], validate, updateFarm);
router.delete('/:id', [param('id').isMongoId()], validate, deleteFarm);

router.post(
  '/:id/logs',
  [
    param('id').isMongoId(),
    body('message').trim().notEmpty().withMessage('Log message is required').isLength({ max: 500 })
  ],
  validate,
  addActivityLog
);

module.exports = router;
