const axios = require('axios');
const WeatherData = require('../models/WeatherData');

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

/**
 * WMO weather codes used by Open-Meteo.
 */
const WEATHER_CODES = {
  0: { text: 'Clear sky', icon: '☀️' },
  1: { text: 'Mainly clear', icon: '🌤️' },
  2: { text: 'Partly cloudy', icon: '⛅' },
  3: { text: 'Overcast', icon: '☁️' },
  45: { text: 'Fog', icon: '🌫️' },
  48: { text: 'Depositing rime fog', icon: '🌫️' },
  51: { text: 'Light drizzle', icon: '🌦️' },
  53: { text: 'Moderate drizzle', icon: '🌦️' },
  55: { text: 'Dense drizzle', icon: '🌧️' },
  56: { text: 'Light freezing drizzle', icon: '🌧️' },
  57: { text: 'Dense freezing drizzle', icon: '🌧️' },
  61: { text: 'Slight rain', icon: '🌦️' },
  63: { text: 'Moderate rain', icon: '🌧️' },
  65: { text: 'Heavy rain', icon: '⛈️' },
  66: { text: 'Light freezing rain', icon: '🌧️' },
  67: { text: 'Heavy freezing rain', icon: '⛈️' },
  71: { text: 'Slight snow', icon: '🌨️' },
  73: { text: 'Moderate snow', icon: '🌨️' },
  75: { text: 'Heavy snow', icon: '❄️' },
  77: { text: 'Snow grains', icon: '🌨️' },
  80: { text: 'Slight rain showers', icon: '🌦️' },
  81: { text: 'Moderate rain showers', icon: '🌧️' },
  82: { text: 'Violent rain showers', icon: '⛈️' },
  85: { text: 'Slight snow showers', icon: '🌨️' },
  86: { text: 'Heavy snow showers', icon: '❄️' },
  95: { text: 'Thunderstorm', icon: '⛈️' },
  96: { text: 'Thunderstorm with hail', icon: '⛈️' },
  99: { text: 'Thunderstorm with heavy hail', icon: '⛈️' }
};

const describeCode = (code) => WEATHER_CODES[code] || { text: 'Unknown', icon: '🌡️' };

/**
 * Geocode a place name with Open-Meteo (free, no API key needed).
 */
const geocode = async (location) => {
  const { data } = await axios.get(GEO_URL, {
    params: { name: location, count: 1, language: 'en', format: 'json' },
    timeout: 12000
  });
  if (!data.results || data.results.length === 0) {
    const error = new Error(`Location "${location}" could not be found`);
    error.statusCode = 404;
    throw error;
  }
  const place = data.results[0];
  return {
    latitude: place.latitude,
    longitude: place.longitude,
    name: [place.name, place.admin1, place.country].filter(Boolean).join(', '),
    country: place.country
  };
};

const buildTips = (current, daily) => {
  const tips = [];
  if (current.temperature_2m >= 35) {
    tips.push('High heat: irrigate early morning and provide shade for young plants.');
  }
  if (current.temperature_2m <= 10) {
    tips.push('Cold conditions: protect sensitive crops from frost at night.');
  }
  if (current.relative_humidity_2m >= 80) {
    tips.push('High humidity: watch for fungal diseases and improve air circulation.');
  }
  if (current.wind_speed_10m >= 30) {
    tips.push('Strong wind: avoid spraying pesticides today.');
  }
  if (current.precipitation > 0) {
    tips.push('Rain today: pause irrigation and check field drainage.');
  }
  const totalRain = daily.precipitation_sum.slice(0, 3).reduce((sum, value) => sum + (value || 0), 0);
  if (totalRain >= 40) {
    tips.push('Heavy rain expected in the next 3 days: secure seedlings and clear drainage channels.');
  } else if (totalRain < 2) {
    tips.push('Little rain expected in the next 3 days: plan irrigation accordingly.');
  }
  if (tips.length === 0) tips.push('Conditions look favourable. Continue regular field monitoring.');
  return tips;
};

const buildAlerts = (current, daily) => {
  const alerts = [];
  if (current.temperature_2m >= 38) alerts.push('Heat wave warning: temperatures above 38°C.');
  if (current.wind_speed_10m >= 40) alerts.push('Strong wind warning: gusts above 40 km/h.');
  if (current.precipitation >= 20) alerts.push('Heavy rainfall warning for today.');
  if ((daily.precipitation_sum[0] || 0) >= 50) alerts.push('Very heavy rain forecast in the next 24 hours.');
  if (current.relative_humidity_2m >= 90) alerts.push('Very high humidity: elevated pest and disease risk.');
  return alerts;
};

const formatForecast = (daily) =>
  daily.time.map((date, index) => {
    const info = describeCode(daily.weather_code[index]);
    return {
      date,
      code: daily.weather_code[index],
      description: info.text,
      icon: info.icon,
      maxTemp: daily.temperature_2m_max[index],
      minTemp: daily.temperature_2m_min[index],
      precipitation: daily.precipitation_sum[index],
      precipitationProbability: daily.precipitation_probability_max?.[index] ?? null,
      windSpeed: daily.wind_speed_10m_max[index]
    };
  });

/**
 * Fetch weather from Open-Meteo, with a DB-backed cache.
 */
const getWeather = async ({ location, lat, lon, forceRefresh = false }) => {
  const cacheMinutes = Number(process.env.WEATHER_CACHE_MINUTES) || 30;
  const cacheKey = (location || `${lat},${lon}`).toLowerCase();
  const cutoff = new Date(Date.now() - cacheMinutes * 60 * 1000);

  if (!forceRefresh) {
    const cached = await WeatherData.findOne({
      location: cacheKey,
      fetchedAt: { $gte: cutoff }
    }).sort({ fetchedAt: -1 });
    if (cached) return { ...cached.toObject(), cached: true };
  }

  let point = { latitude: Number(lat), longitude: Number(lon), name: location };
  if (!location || Number.isNaN(point.latitude) || Number.isNaN(point.longitude) || !lat || !lon) {
    if (!location) {
      const error = new Error('A location name or latitude/longitude pair is required');
      error.statusCode = 400;
      throw error;
    }
    point = await geocode(location);
  }

  const { data } = await axios.get(FORECAST_URL, {
    params: {
      latitude: point.latitude,
      longitude: point.longitude,
      current:
        'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m',
      daily:
        'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max',
      timezone: 'auto',
      forecast_days: 7
    },
    timeout: 15000
  });

  const currentInfo = describeCode(data.current.weather_code);
  const current = {
    temperature: data.current.temperature_2m,
    feelsLike: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    precipitation: data.current.precipitation,
    windSpeed: data.current.wind_speed_10m,
    code: data.current.weather_code,
    description: currentInfo.text,
    icon: currentInfo.icon
  };
  const forecast = formatForecast(data.daily);
  const rawDaily = { precipitation_sum: data.daily.precipitation_sum };
  const alerts = buildAlerts(
    { ...data.current, wind_speed_10m: data.current.wind_speed_10m },
    rawDaily
  );
  const tips = buildTips(data.current, rawDaily);

  const saved = await WeatherData.create({
    location: cacheKey,
    latitude: point.latitude,
    longitude: point.longitude,
    timezone: data.timezone,
    current,
    forecast,
    alerts,
    tips,
    fetchedAt: new Date()
  });

  return {
    ...saved.toObject(),
    resolvedName: point.name || location,
    cached: false
  };
};

module.exports = { getWeather, geocode, describeCode };
