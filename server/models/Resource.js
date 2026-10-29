const mongoose = require('mongoose');

/**
 * Resource catalog: seeds, fertilizers, tools and pesticides.
 * New resources must be approved by an admin before farmers can order them.
 */
const resourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Resource name is required'],
      trim: true,
      maxlength: [100, 'Resource name cannot exceed 100 characters']
    },
    category: {
      type: String,
      enum: ['seeds', 'fertilizer', 'pesticide', 'tool', 'other'],
      required: true,
      index: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: ''
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    unit: { type: String, default: 'unit', trim: true, maxlength: 30 },
    stock: { type: Number, default: 0, min: [0, 'Stock cannot be negative'] },
    isApproved: { type: Boolean, default: false, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

resourceSchema.index({ category: 1, isApproved: 1, price: 1 });
resourceSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Resource', resourceSchema);
