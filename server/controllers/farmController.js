const Farm = require('../models/Farm');
const Crop = require('../models/Crop');
const SoilReport = require('../models/SoilReport');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');

const canAccess = (farm, user) =>
  user.role === 'admin' || farm.owner.toString() === user._id.toString();

/**
 * GET /api/farms
 */
const getFarms = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.user.role !== 'admin') filter.owner = req.user._id;
  else if (req.query.owner) filter.owner = req.query.owner;

  if (req.query.q) {
    filter.$or = [
      { name: { $regex: req.query.q, $options: 'i' } },
      { location: { $regex: req.query.q, $options: 'i' } }
    ];
  }

  const [farms, total] = await Promise.all([
    Farm.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Farm.countDocuments(filter)
  ]);

  res.json({ success: true, data: farms, meta: buildMeta(page, limit, total) });
});

/**
 * POST /api/farms
 */
const createFarm = asyncHandler(async (req, res) => {
  const { name, location, size, sizeUnit, soilType, notes } = req.body;
  const farm = await Farm.create({
    owner: req.user._id,
    name,
    location,
    size,
    sizeUnit,
    soilType,
    notes,
    activityLogs: [{ message: 'Farm created' }]
  });
  res.status(201).json({ success: true, message: 'Farm created', data: farm });
});

/**
 * GET /api/farms/:id
 */
const getFarm = asyncHandler(async (req, res) => {
  const farm = await Farm.findById(req.params.id).populate('owner', 'name email location');
  if (!farm) {
    res.status(404);
    throw new Error('Farm not found');
  }
  if (!canAccess(farm, req.user)) {
    res.status(403);
    throw new Error('You do not have access to this farm');
  }

  const [cropCount, activeCrops, reports] = await Promise.all([
    Crop.countDocuments({ farm: farm._id }),
    Crop.countDocuments({ farm: farm._id, status: 'growing' }),
    SoilReport.countDocuments({ farm: farm._id })
  ]);

  res.json({
    success: true,
    data: { ...farm.toObject(), stats: { cropCount, activeCrops, reports } }
  });
});

/**
 * PUT /api/farms/:id
 */
const updateFarm = asyncHandler(async (req, res) => {
  const farm = await Farm.findById(req.params.id);
  if (!farm) {
    res.status(404);
    throw new Error('Farm not found');
  }
  if (!canAccess(farm, req.user)) {
    res.status(403);
    throw new Error('You do not have access to this farm');
  }

  ['name', 'location', 'size', 'sizeUnit', 'soilType', 'notes'].forEach((field) => {
    if (req.body[field] !== undefined) farm[field] = req.body[field];
  });
  farm.activityLogs.push({ message: 'Farm details updated' });

  await farm.save();
  res.json({ success: true, message: 'Farm updated', data: farm });
});

/**
 * DELETE /api/farms/:id
 * Cascades to crops and soil reports belonging to the farm.
 */
const deleteFarm = asyncHandler(async (req, res) => {
  const farm = await Farm.findById(req.params.id);
  if (!farm) {
    res.status(404);
    throw new Error('Farm not found');
  }
  if (!canAccess(farm, req.user)) {
    res.status(403);
    throw new Error('You do not have access to this farm');
  }

  await Promise.all([
    Crop.deleteMany({ farm: farm._id }),
    SoilReport.deleteMany({ farm: farm._id })
  ]);
  await farm.deleteOne();

  res.json({ success: true, message: 'Farm and related records deleted' });
});

/**
 * POST /api/farms/:id/logs
 */
const addActivityLog = asyncHandler(async (req, res) => {
  const farm = await Farm.findById(req.params.id);
  if (!farm) {
    res.status(404);
    throw new Error('Farm not found');
  }
  if (!canAccess(farm, req.user)) {
    res.status(403);
    throw new Error('You do not have access to this farm');
  }

  farm.activityLogs.push({ message: req.body.message });
  await farm.save();
  res.status(201).json({ success: true, message: 'Activity logged', data: farm });
});

module.exports = { getFarms, createFarm, getFarm, updateFarm, deleteFarm, addActivityLog };
