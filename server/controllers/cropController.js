const Crop = require('../models/Crop');
const Farm = require('../models/Farm');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');

const canAccess = (crop, user) =>
  user.role === 'admin' || crop.owner.toString() === user._id.toString();

/**
 * GET /api/crops
 */
const getCrops = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.user.role !== 'admin') filter.owner = req.user._id;
  if (req.query.farm) filter.farm = req.query.farm;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.season) filter.season = req.query.season;
  if (req.query.q) filter.name = { $regex: req.query.q, $options: 'i' };

  const [crops, total] = await Promise.all([
    Crop.find(filter).populate('farm', 'name location').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Crop.countDocuments(filter)
  ]);

  res.json({ success: true, data: crops, meta: buildMeta(page, limit, total) });
});

/**
 * POST /api/crops
 */
const createCrop = asyncHandler(async (req, res) => {
  const farm = await Farm.findById(req.body.farm);
  if (!farm) {
    res.status(404);
    throw new Error('Farm not found');
  }
  if (req.user.role !== 'admin' && farm.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You can only add crops to your own farm');
  }

  const crop = await Crop.create({
    ...req.body,
    owner: farm.owner
  });

  farm.activityLogs.push({ message: `Crop "${crop.name}" added` });
  await farm.save();

  res.status(201).json({ success: true, message: 'Crop created', data: crop });
});

/**
 * GET /api/crops/:id
 */
const getCrop = asyncHandler(async (req, res) => {
  const crop = await Crop.findById(req.params.id).populate('farm', 'name location soilType');
  if (!crop) {
    res.status(404);
    throw new Error('Crop not found');
  }
  if (!canAccess(crop, req.user)) {
    res.status(403);
    throw new Error('You do not have access to this crop');
  }
  res.json({ success: true, data: crop });
});

/**
 * PUT /api/crops/:id
 */
const updateCrop = asyncHandler(async (req, res) => {
  const crop = await Crop.findById(req.params.id);
  if (!crop) {
    res.status(404);
    throw new Error('Crop not found');
  }
  if (!canAccess(crop, req.user)) {
    res.status(403);
    throw new Error('You do not have access to this crop');
  }

  ['name', 'season', 'plantingDate', 'harvestDate', 'status', 'soilHealth'].forEach((field) => {
    if (req.body[field] !== undefined) crop[field] = req.body[field];
  });

  await crop.save();
  res.json({ success: true, message: 'Crop updated', data: crop });
});

/**
 * DELETE /api/crops/:id
 */
const deleteCrop = asyncHandler(async (req, res) => {
  const crop = await Crop.findById(req.params.id);
  if (!crop) {
    res.status(404);
    throw new Error('Crop not found');
  }
  if (!canAccess(crop, req.user)) {
    res.status(403);
    throw new Error('You do not have access to this crop');
  }
  await crop.deleteOne();
  res.json({ success: true, message: 'Crop deleted' });
});

/**
 * POST /api/crops/:id/notes
 */
const addGrowthNote = asyncHandler(async (req, res) => {
  const crop = await Crop.findById(req.params.id);
  if (!crop) {
    res.status(404);
    throw new Error('Crop not found');
  }
  if (!canAccess(crop, req.user)) {
    res.status(403);
    throw new Error('You do not have access to this crop');
  }

  crop.growthNotes.push({ note: req.body.note });
  await crop.save();
  res.status(201).json({ success: true, message: 'Growth note added', data: crop });
});

module.exports = { getCrops, createCrop, getCrop, updateCrop, deleteCrop, addGrowthNote };
