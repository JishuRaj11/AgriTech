const ForumPost = require('../models/ForumPost');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');

const isAuthor = (post, user) => post.author._id?.toString() === user._id.toString() || post.author.toString() === user._id.toString();

const canModify = (post, user) => user.role === 'admin' || isAuthor(post, user);

/**
 * GET /api/forum
 */
const getPosts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.user.role !== 'admin') filter.isHidden = false;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.q) {
    filter.$or = [
      { title: { $regex: req.query.q, $options: 'i' } },
      { content: { $regex: req.query.q, $options: 'i' } }
    ];
  }

  const [posts, total] = await Promise.all([
    ForumPost.find(filter)
      .populate('author', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-comments'),
    ForumPost.countDocuments(filter)
  ]);

  res.json({ success: true, data: posts, meta: buildMeta(page, limit, total) });
});

/**
 * GET /api/forum/:id
 */
const getPost = asyncHandler(async (req, res) => {
  const post = await ForumPost.findById(req.params.id)
    .populate('author', 'name role')
    .populate('comments.author', 'name role');
  if (!post) {
    res.status(404);
    throw new Error('Forum post not found');
  }
  if (post.isHidden && req.user.role !== 'admin' && !isAuthor(post, req.user)) {
    res.status(403);
    throw new Error('This post has been hidden by a moderator');
  }
  res.json({ success: true, data: post });
});

/**
 * POST /api/forum
 */
const createPost = asyncHandler(async (req, res) => {
  const post = await ForumPost.create({
    author: req.user._id,
    title: req.body.title,
    content: req.body.content,
    category: req.body.category || 'General'
  });
  res.status(201).json({ success: true, message: 'Post created', data: post });
});

/**
 * PUT /api/forum/:id (author or admin)
 */
const updatePost = asyncHandler(async (req, res) => {
  const post = await ForumPost.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error('Forum post not found');
  }
  if (!canModify(post, req.user)) {
    res.status(403);
    throw new Error('You cannot edit this post');
  }

  ['title', 'content', 'category'].forEach((field) => {
    if (req.body[field] !== undefined) post[field] = req.body[field];
  });
  await post.save();
  res.json({ success: true, message: 'Post updated', data: post });
});

/**
 * DELETE /api/forum/:id (author or admin)
 */
const deletePost = asyncHandler(async (req, res) => {
  const post = await ForumPost.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error('Forum post not found');
  }
  if (!canModify(post, req.user)) {
    res.status(403);
    throw new Error('You cannot delete this post');
  }
  await post.deleteOne();
  res.json({ success: true, message: 'Post deleted' });
});

/**
 * POST /api/forum/:id/comments
 */
const addComment = asyncHandler(async (req, res) => {
  const post = await ForumPost.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error('Forum post not found');
  }
  if (post.isHidden && req.user.role !== 'admin' && !isAuthor(post, req.user)) {
    res.status(403);
    throw new Error('This post has been hidden by a moderator');
  }

  post.comments.push({ author: req.user._id, content: req.body.content });
  await post.save();
  await post.populate([
    { path: 'author', select: 'name role' },
    { path: 'comments.author', select: 'name role' }
  ]);

  res.status(201).json({ success: true, message: 'Comment added', data: post });
});

/**
 * DELETE /api/forum/:id/comments/:commentId
 */
const deleteComment = asyncHandler(async (req, res) => {
  const post = await ForumPost.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error('Forum post not found');
  }

  const comment = post.comments.id(req.params.commentId);
  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }

  const commentAuthor = comment.author.toString();
  const allowed =
    req.user.role === 'admin' ||
    commentAuthor === req.user._id.toString() ||
    isAuthor(post, req.user);
  if (!allowed) {
    res.status(403);
    throw new Error('You cannot delete this comment');
  }

  comment.deleteOne();
  await post.save();
  res.json({ success: true, message: 'Comment deleted' });
});

/**
 * PATCH /api/forum/:id/moderate (admin)
 */
const moderatePost = asyncHandler(async (req, res) => {
  const post = await ForumPost.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error('Forum post not found');
  }

  post.isHidden = req.body.isHidden === undefined ? !post.isHidden : Boolean(req.body.isHidden);
  await post.save();

  res.json({
    success: true,
    message: post.isHidden ? 'Post hidden from community' : 'Post restored',
    data: post
  });
});

module.exports = {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  addComment,
  deleteComment,
  moderatePost
};
