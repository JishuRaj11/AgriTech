const mongoose = require('mongoose');

/**
 * Cached weather responses so repeat lookups do not hammer the public API.
 */
const weatherDataSchema = new mongoose.Schema(
  {
    location: { type: String, required: true, trim: true, lowercase: true },
    latitude: { type: Number },
    longitude: { type: Number },
    timezone: { type: String, default: 'auto' },
    current: { type: mongoose.Schema.Types.Mixed },
    forecast: { type: [mongoose.Schema.Types.Mixed], default: [] },
    alerts: { type: [String], default: [] },
    tips: { type: [String], default: [] },
    fetchedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

weatherDataSchema.index({ location: 1, fetchedAt: -1 });

module.exports = mongoose.model('WeatherData', weatherDataSchema);
