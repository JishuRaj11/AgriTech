const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    }
  },
  { timestamps: true }
);

/**
 * Community forum posts with threaded (flat) comments and moderation flag.
 */
const forumPostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      maxlength: [5000, 'Content cannot exceed 5000 characters']
    },
    category: {
      type: String,
      enum: ['General', 'Crops', 'Pests', 'Weather', 'Marketing', 'Other'],
      default: 'General'
    },
    comments: { type: [commentSchema], default: [] },
    isHidden: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

forumPostSchema.index({ isHidden: 1, createdAt: -1 });
forumPostSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('ForumPost', forumPostSchema);
