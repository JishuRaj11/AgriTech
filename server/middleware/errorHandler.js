const logger = require('../utils/logger');

/**
 * 404 handler for unknown API routes.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Central error handler. Converts common Mongoose/JWT errors into friendly messages.
 */
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  let statusCode = err.statusCode || err.status || (res.statusCode >= 400 ? res.statusCode : 500);
  let message = err.message || 'Something went wrong';

  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Requested record was not found';
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value for ${field}`;
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Session expired, please log in again';
  }

  if (statusCode >= 500) logger.error(`${req.method} ${req.originalUrl} -> ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {})
  });
};

module.exports = { notFound, errorHandler };
