const express = require('express');
const { body, param } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createConsultation,
  getConsultations,
  getConsultation,
  replyConsultation,
  deleteConsultation
} = require('../controllers/consultationController');

const router = express.Router();

router.use(protect);

router.get('/', getConsultations);
router.get('/:id', [param('id').isMongoId()], validate, getConsultation);

router.post(
  '/',
  authorize('farmer'),
  [
    body('question')
      .trim()
      .notEmpty()
      .withMessage('Question is required')
      .isLength({ max: 2000 })
      .withMessage('Question is too long'),
    body('crop').optional().trim().isLength({ max: 80 })
  ],
  validate,
  createConsultation
);

router.patch(
  '/:id/reply',
  authorize('admin'),
  [
    param('id').isMongoId(),
    body('reply').trim().notEmpty().withMessage('Reply is required').isLength({ max: 2000 }),
    body('close').optional().isBoolean()
  ],
  validate,
  replyConsultation
);

router.delete('/:id', [param('id').isMongoId()], validate, deleteConsultation);

module.exports = router;
