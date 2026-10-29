const { getWeather } = require('../services/weatherService');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/weather?location=City&lat=&lon=&refresh=true
 * Uses the logged-in user's saved location when no query location is supplied.
 */
const fetchWeather = asyncHandler(async (req, res) => {
  const location = req.query.location || req.user.location;
  const lat = req.query.lat;
  const lon = req.query.lon;
  const forceRefresh = req.query.refresh === 'true';

  if (!location && (!lat || !lon)) {
    res.status(400);
    throw new Error('Provide a location name or latitude and longitude');
  }

  const data = await getWeather({ location, lat, lon, forceRefresh });
  res.json({ success: true, data });
});

module.exports = { fetchWeather };
