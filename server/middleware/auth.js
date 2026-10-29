const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Verify the JWT from the Authorization header and attach the user to req.user.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) token = header.split(' ')[1];

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      res.status(401);
      throw new Error('Not authorized, user no longer exists');
    }
    req.user = user;
    return next();
  } catch (error) {
    res.status(401);
    const authError = new Error('Not authorized, token is invalid or expired');
    authError.statusCode = 401;
    throw authError;
  }
});

/**
 * Role-based access control. Usage: authorize('admin') or authorize('farmer','admin').
 */
const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      res.status(401);
      const error = new Error('Not authorized');
      error.statusCode = 401;
      return next(error);
    }
    if (!roles.includes(req.user.role)) {
      res.status(403);
      const error = new Error('Forbidden: you do not have permission to perform this action');
      error.statusCode = 403;
      return next(error);
    }
    return next();
  };

module.exports = { protect, authorize };
