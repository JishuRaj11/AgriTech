const mongoose = require('mongoose');

/**
 * SoilReport keeps the history of soil analyses for a farm.
 */
const soilReportSchema = new mongoose.Schema(
  {
    farm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farm',
      required: true,
      index: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    crop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crop',
      default: null
    },
    ph: { type: Number, required: true, min: 0, max: 14 },
    nitrogen: { type: Number, required: true, min: 0 },
    phosphorus: { type: Number, required: true, min: 0 },
    potassium: { type: Number, required: true, min: 0 },
    moisture: { type: Number, required: true, min: 0, max: 100 },
    soilType: {
      type: String,
      enum: ['clay', 'sandy', 'loamy', 'silt', 'peaty', 'chalky', 'other'],
      default: 'loamy'
    },
    healthScore: { type: Number, min: 0, max: 100 },
    healthLabel: { type: String, enum: ['poor', 'fair', 'good', 'excellent'] },
    recommendations: {
      crops: { type: [String], default: [] },
      fertilizers: { type: [String], default: [] },
      notes: { type: [String], default: [] }
    }
  },
  { timestamps: true }
);

soilReportSchema.index({ farm: 1, createdAt: -1 });
soilReportSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('SoilReport', soilReportSchema);
