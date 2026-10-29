const express = require('express');
const { body, param } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  getPestAlerts,
  getPestAlert,
  createPestAlert,
  updatePestAlert,
  deletePestAlert
} = require('../controllers/pestController');

const router = express.Router();

router.use(protect);

const pestFields = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 150 }),
  body('crop').optional().trim().notEmpty().withMessage('Crop cannot be empty'),
  body('symptoms').optional().trim().notEmpty().withMessage('Symptoms cannot be empty'),
  body('season').optional().isIn(['Kharif', 'Rabi', 'Zaid', 'All year']),
  body('region').optional().trim().notEmpty(),
  body('treatment').optional().trim().notEmpty().withMessage('Treatment cannot be empty'),
  body('severity').optional().isIn(['low', 'medium', 'high']),
  body('isActive').optional().isBoolean()
];

router.get('/', getPestAlerts);
router.get('/:id', [param('id').isMongoId()], validate, getPestAlert);

router.post(
  '/',
  authorize('admin'),
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 150 }),
    body('crop').trim().notEmpty().withMessage('Crop is required'),
    body('symptoms').trim().notEmpty().withMessage('Symptoms are required'),
    body('treatment').trim().notEmpty().withMessage('Treatment is required'),
    body('season').optional().isIn(['Kharif', 'Rabi', 'Zaid', 'All year']),
    body('severity').optional().isIn(['low', 'medium', 'high'])
  ],
  validate,
  createPestAlert
);

router.put('/:id', authorize('admin'), [param('id').isMongoId(), ...pestFields], validate, updatePestAlert);
router.delete('/:id', authorize('admin'), [param('id').isMongoId()], validate, deletePestAlert);

module.exports = router;
