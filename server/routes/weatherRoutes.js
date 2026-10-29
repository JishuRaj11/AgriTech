const express = require('express');
const { query } = require('express-validator');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { fetchWeather } = require('../controllers/weatherController');

const router = express.Router();

router.use(protect);

router.get(
  '/',
  [
    query('location').optional().trim().isLength({ max: 120 }),
    query('lat').optional().isFloat({ min: -90, max: 90 }),
    query('lon').optional().isFloat({ min: -180, max: 180 })
  ],
  validate,
  fetchWeather
);

module.exports = router;
