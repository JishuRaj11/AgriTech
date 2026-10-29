const User = require('../models/User');
const Farm = require('../models/Farm');
const Crop = require('../models/Crop');
const SoilReport = require('../models/SoilReport');
const Order = require('../models/Order');
const Resource = require('../models/Resource');
const PestAlert = require('../models/PestAlert');
const Consultation = require('../models/Consultation');
const ForumPost = require('../models/ForumPost');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');

/**
 * GET /api/admin/stats
 * Aggregated dashboard statistics.
 */
const getStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    farmers,
    admins,
    totalFarms,
    totalCrops,
    cropsByStatus,
    totalOrders,
    ordersByStatus,
    revenueAgg,
    totalResources,
    pendingResources,
    totalPestAlerts,
    activePestAlerts,
    totalConsultations,
    openConsultations,
    totalPosts,
    hiddenPosts
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'farmer' }),
    User.countDocuments({ role: 'admin' }),
    Farm.countDocuments(),
    Crop.countDocuments(),
    Crop.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.countDocuments(),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' } } }
    ]),
    Resource.countDocuments(),
    Resource.countDocuments({ isApproved: false }),
    PestAlert.countDocuments(),
    PestAlert.countDocuments({ isActive: true }),
    Consultation.countDocuments(),
    Consultation.countDocuments({ status: 'open' }),
    ForumPost.countDocuments(),
    ForumPost.countDocuments({ isHidden: true })
  ]);

  const toMap = (rows) => rows.reduce((acc, row) => ({ ...acc, [row._id]: row.count }), {});

  res.json({
    success: true,
    data: {
      users: { total: totalUsers, farmers, admins },
      farms: { total: totalFarms },
      crops: { total: totalCrops, byStatus: toMap(cropsByStatus) },
      orders: {
        total: totalOrders,
        byStatus: toMap(ordersByStatus),
        revenue: revenueAgg[0]?.revenue || 0
      },
      resources: { total: totalResources, pending: pendingResources },
      pests: { total: totalPestAlerts, active: activePestAlerts },
      consultations: { total: totalConsultations, open: openConsultations },
      forum: { total: totalPosts, hidden: hiddenPosts }
    }
  });
});

/**
 * GET /api/admin/users
 */
const getUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.query.role) filter.role = req.query.role;
  if (req.query.q) {
    filter.$or = [
      { name: { $regex: req.query.q, $options: 'i' } },
      { email: { $regex: req.query.q, $options: 'i' } }
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter)
  ]);

  res.json({ success: true, data: users, meta: buildMeta(page, limit, total) });
});

/**
 * PATCH /api/admin/users/:id/role
 */
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['farmer', 'admin'].includes(role)) {
    res.status(400);
    throw new Error('Role must be either farmer or admin');
  }
  if (req.params.id === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot change your own role');
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.role = role;
  await user.save();
  res.json({ success: true, message: `User role updated to ${role}`, data: user });
});

/**
 * DELETE /api/admin/users/:id
 * Removes the user and cascades their owned records.
 */
const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot delete your own account');
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const farms = await Farm.find({ owner: user._id }).select('_id');
  const farmIds = farms.map((farm) => farm._id);

  await Promise.all([
    Farm.deleteMany({ owner: user._id }),
    Crop.deleteMany({ $or: [{ owner: user._id }, { farm: { $in: farmIds } }] }),
    SoilReport.deleteMany({ $or: [{ owner: user._id }, { farm: { $in: farmIds } }] }),
    Order.deleteMany({ user: user._id }),
    Consultation.deleteMany({ farmer: user._id }),
    ForumPost.deleteMany({ author: user._id }),
    ForumPost.updateMany({}, { $pull: { comments: { author: user._id } } })
  ]);

  await user.deleteOne();
  res.json({ success: true, message: 'User and related records deleted' });
});

module.exports = { getStats, getUsers, updateUserRole, deleteUser };
