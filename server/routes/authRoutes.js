const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout
} = require('../controllers/authController');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 80 }),
    body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('language').optional().isIn(['en', 'hi', 'ta']).withMessage('Unsupported language'),
    body('location').optional().trim().isLength({ max: 150 })
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
  ],
  validate,
  login
);

router.get('/me', protect, getMe);

router.put(
  '/profile',
  protect,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 80 }),
    body('email').optional().trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('language').optional().isIn(['en', 'hi', 'ta']),
    body('location').optional().trim().isLength({ max: 150 })
  ],
  validate,
  updateProfile
);

router.put(
  '/password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ],
  validate,
  changePassword
);

router.post('/logout', protect, logout);

module.exports = router;
