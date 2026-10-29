const mongoose = require('mongoose');

const growthNoteSchema = new mongoose.Schema(
  {
    note: { type: String, required: true, trim: true, maxlength: 1000 },
    date: { type: Date, default: Date.now }
  },
  { _id: false }
);

/**
 * Crop collection. Soil health is stored as a snapshot on every crop.
 */
const cropSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: [true, 'Crop name is required'],
      trim: true,
      maxlength: [80, 'Crop name cannot exceed 80 characters']
    },
    season: {
      type: String,
      enum: ['Kharif', 'Rabi', 'Zaid', 'All year'],
      default: 'Kharif'
    },
    plantingDate: {
      type: Date,
      required: [true, 'Planting date is required']
    },
    harvestDate: { type: Date },
    status: {
      type: String,
      enum: ['planned', 'growing', 'harvested', 'failed'],
      default: 'planned',
      index: true
    },
    soilHealth: {
      ph: { type: Number, min: 0, max: 14 },
      nitrogen: { type: Number, min: 0 },
      phosphorus: { type: Number, min: 0 },
      potassium: { type: Number, min: 0 },
      moisture: { type: Number, min: 0, max: 100 },
      soilType: {
        type: String,
        enum: ['clay', 'sandy', 'loamy', 'silt', 'peaty', 'chalky', 'other'],
        default: 'loamy'
      }
    },
    growthNotes: { type: [growthNoteSchema], default: [] }
  },
  { timestamps: true }
);

cropSchema.index({ owner: 1, status: 1, createdAt: -1 });
cropSchema.index({ farm: 1, name: 1 });

module.exports = mongoose.model('Crop', cropSchema);
