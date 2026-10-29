const mongoose = require('mongoose');

/**
 * Pest/disease alerts that farmers can filter by crop, season and region.
 */
const pestAlertSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    crop: {
      type: String,
      required: [true, 'Crop is required'],
      trim: true,
      index: true
    },
    symptoms: {
      type: String,
      required: [true, 'Symptoms are required'],
      trim: true,
      maxlength: 1000
    },
    season: {
      type: String,
      enum: ['Kharif', 'Rabi', 'Zaid', 'All year'],
      default: 'All year',
      index: true
    },
    region: {
      type: String,
      required: [true, 'Region is required'],
      trim: true,
      default: 'All regions',
      index: true
    },
    treatment: {
      type: String,
      required: [true, 'Treatment is required'],
      trim: true,
      maxlength: 1000
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

pestAlertSchema.index({ crop: 1, region: 1, season: 1, isActive: 1 });
pestAlertSchema.index({ title: 'text', symptoms: 'text', treatment: 'text' });

module.exports = mongoose.model('PestAlert', pestAlertSchema);
