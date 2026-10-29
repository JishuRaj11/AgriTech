const { validationResult } = require('express-validator');

/**
 * Runs after express-validator chains and returns a clean 400 payload.
 */
const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: result.array().map((err) => ({ field: err.path, message: err.msg }))
  });
};

module.exports = validate;
