const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    message: { type: String, required: true, trim: true, maxlength: 500 },
    date: { type: Date, default: Date.now }
  },
  { _id: false }
);

/**
 * Farm collection. Each farm belongs to exactly one farmer.
 */
const farmSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Farm name is required'],
      trim: true,
      maxlength: [100, 'Farm name cannot exceed 100 characters']
    },
    location: {
      type: String,
      required: [true, 'Farm location is required'],
      trim: true,
      maxlength: [150, 'Location cannot exceed 150 characters']
    },
    size: {
      type: Number,
      required: [true, 'Farm size is required'],
      min: [0.01, 'Farm size must be greater than 0']
    },
    sizeUnit: {
      type: String,
      enum: ['acre', 'hectare'],
      default: 'acre'
    },
    soilType: {
      type: String,
      enum: ['clay', 'sandy', 'loamy', 'silt', 'peaty', 'chalky', 'other'],
      default: 'loamy'
    },
    notes: { type: String, trim: true, maxlength: 1000, default: '' },
    activityLogs: { type: [activityLogSchema], default: [] }
  },
  { timestamps: true }
);

farmSchema.index({ owner: 1, createdAt: -1 });
farmSchema.index({ name: 'text', location: 'text' });

module.exports = mongoose.model('Farm', farmSchema);
