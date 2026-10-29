const express = require('express');
const { body, param } = require('express-validator');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { analyze, getReports, getReport, deleteReport } = require('../controllers/soilController');

const router = express.Router();

router.use(protect);

router.post(
  '/analyze',
  [
    body('farm').isMongoId().withMessage('A valid farm is required'),
    body('crop').optional({ nullable: true }).isMongoId(),
    body('ph').isFloat({ min: 0, max: 14 }).withMessage('pH must be between 0 and 14'),
    body('nitrogen').isFloat({ min: 0 }).withMessage('Nitrogen is required'),
    body('phosphorus').isFloat({ min: 0 }).withMessage('Phosphorus is required'),
    body('potassium').isFloat({ min: 0 }).withMessage('Potassium is required'),
    body('moisture').isFloat({ min: 0, max: 100 }).withMessage('Moisture must be between 0 and 100'),
    body('soilType')
      .optional()
      .isIn(['clay', 'sandy', 'loamy', 'silt', 'peaty', 'chalky', 'other'])
  ],
  validate,
  analyze
);

router.get('/reports', getReports);
router.get('/reports/:id', [param('id').isMongoId()], validate, getReport);
router.delete('/reports/:id', [param('id').isMongoId()], validate, deleteReport);

module.exports = router;
