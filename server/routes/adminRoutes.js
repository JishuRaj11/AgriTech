const express = require('express');
const { body, param } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { getStats, getUsers, updateUserRole, deleteUser } = require('../controllers/adminController');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);

router.patch(
  '/users/:id/role',
  [param('id').isMongoId(), body('role').isIn(['farmer', 'admin']).withMessage('Invalid role')],
  validate,
  updateUserRole
);

router.delete('/users/:id', [param('id').isMongoId()], validate, deleteUser);

module.exports = router;
