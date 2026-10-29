const express = require('express');
const { body, param } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  addComment,
  deleteComment,
  moderatePost
} = require('../controllers/forumController');

const router = express.Router();

router.use(protect);

const postFields = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 150 }),
  body('content').optional().trim().notEmpty().withMessage('Content cannot be empty').isLength({ max: 5000 }),
  body('category').optional().isIn(['General', 'Crops', 'Pests', 'Weather', 'Marketing', 'Other'])
];

router.get('/', getPosts);
router.get('/:id', [param('id').isMongoId()], validate, getPost);

router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 150 }),
    body('content').trim().notEmpty().withMessage('Content is required').isLength({ max: 5000 }),
    body('category').optional().isIn(['General', 'Crops', 'Pests', 'Weather', 'Marketing', 'Other'])
  ],
  validate,
  createPost
);

router.put('/:id', [param('id').isMongoId(), ...postFields], validate, updatePost);
router.delete('/:id', [param('id').isMongoId()], validate, deletePost);

router.post(
  '/:id/comments',
  [
    param('id').isMongoId(),
    body('content').trim().notEmpty().withMessage('Comment is required').isLength({ max: 1000 })
  ],
  validate,
  addComment
);

router.delete(
  '/:id/comments/:commentId',
  [param('id').isMongoId(), param('commentId').isMongoId()],
  validate,
  deleteComment
);

router.patch(
  '/:id/moderate',
  authorize('admin'),
  [param('id').isMongoId(), body('isHidden').optional().isBoolean()],
  validate,
  moderatePost
);

module.exports = router;
