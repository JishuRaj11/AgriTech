const mongoose = require('mongoose');

/**
 * One-to-one expert consultation between a farmer and an expert (admin).
 */
const consultationSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    crop: { type: String, trim: true, default: '' },
    question: {
      type: String,
      required: [true, 'Question is required'],
      trim: true,
      maxlength: [2000, 'Question cannot exceed 2000 characters']
    },
    reply: {
      type: String,
      trim: true,
      maxlength: [2000, 'Reply cannot exceed 2000 characters'],
      default: ''
    },
    status: {
      type: String,
      enum: ['open', 'answered', 'closed'],
      default: 'open',
      index: true
    },
    repliedAt: { type: Date }
  },
  { timestamps: true }
);

consultationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Consultation', consultationSchema);
