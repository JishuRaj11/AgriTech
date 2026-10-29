const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');

/**
 * POST /api/auth/register
 * Public registration always creates a farmer account.
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, language, location } = req.body;
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    language: language || 'en',
    location: location || '',
    role: 'farmer'
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    token: generateToken(user),
    user
  });
});

/**
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.json({
    success: true,
    message: 'Login successful',
    token: generateToken(user),
    user: user.toJSON()
  });
});

/**
 * GET /api/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

/**
 * PUT /api/auth/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const { name, email, language, location } = req.body;
  if (email && email.toLowerCase() !== user.email) {
    const taken = await User.findOne({ email: email.toLowerCase() });
    if (taken) {
      res.status(400);
      throw new Error('That email is already in use');
    }
    user.email = email.toLowerCase();
  }
  if (name !== undefined) user.name = name;
  if (language !== undefined) user.language = language;
  if (location !== undefined) user.location = location;

  await user.save();
  res.json({ success: true, message: 'Profile updated', user });
});

/**
 * PUT /api/auth/password
 */
const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  const { currentPassword, newPassword } = req.body;
  if (!(await user.matchPassword(currentPassword))) {
    res.status(400);
    throw new Error('Current password is incorrect');
  }
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password changed successfully' });
});

/**
 * POST /api/auth/logout
 * JWTs are stateless, so logout simply tells the client to drop the token.
 */
const logout = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = { register, login, getMe, updateProfile, changePassword, logout };
