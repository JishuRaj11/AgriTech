const PestAlert = require('../models/PestAlert');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');

/**
 * GET /api/pests
 */
const getPestAlerts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.user.role !== 'admin') filter.isActive = true;
  else if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

  if (req.query.crop) filter.crop = { $regex: req.query.crop, $options: 'i' };
  if (req.query.season && req.query.season !== 'All year') {
    filter.season = { $in: [req.query.season, 'All year'] };
  }
  if (req.query.region) {
    filter.$or = [
      { region: { $regex: req.query.region, $options: 'i' } },
      { region: { $regex: '^all regions$', $options: 'i' } }
    ];
  }
  if (req.query.q) {
    filter.$and = [
      {
        $or: [
          { title: { $regex: req.query.q, $options: 'i' } },
          { symptoms: { $regex: req.query.q, $options: 'i' } },
          { treatment: { $regex: req.query.q, $options: 'i' } }
        ]
      }
    ];
  }

  const [alerts, total] = await Promise.all([
    PestAlert.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    PestAlert.countDocuments(filter)
  ]);

  res.json({ success: true, data: alerts, meta: buildMeta(page, limit, total) });
});

/**
 * GET /api/pests/:id
 */
const getPestAlert = asyncHandler(async (req, res) => {
  const alert = await PestAlert.findById(req.params.id);
  if (!alert) {
    res.status(404);
    throw new Error('Pest alert not found');
  }
  if (!alert.isActive && req.user.role !== 'admin') {
    res.status(404);
    throw new Error('Pest alert not found');
  }
  res.json({ success: true, data: alert });
});

/**
 * POST /api/pests (admin)
 */
const createPestAlert = asyncHandler(async (req, res) => {
  const alert = await PestAlert.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, message: 'Pest alert created', data: alert });
});

/**
 * PUT /api/pests/:id (admin)
 */
const updatePestAlert = asyncHandler(async (req, res) => {
  const alert = await PestAlert.findById(req.params.id);
  if (!alert) {
    res.status(404);
    throw new Error('Pest alert not found');
  }

  ['title', 'crop', 'symptoms', 'season', 'region', 'treatment', 'severity', 'isActive'].forEach(
    (field) => {
      if (req.body[field] !== undefined) alert[field] = req.body[field];
    }
  );

  await alert.save();
  res.json({ success: true, message: 'Pest alert updated', data: alert });
});

/**
 * DELETE /api/pests/:id (admin)
 */
const deletePestAlert = asyncHandler(async (req, res) => {
  const alert = await PestAlert.findById(req.params.id);
  if (!alert) {
    res.status(404);
    throw new Error('Pest alert not found');
  }
  await alert.deleteOne();
  res.json({ success: true, message: 'Pest alert deleted' });
});

module.exports = { getPestAlerts, getPestAlert, createPestAlert, updatePestAlert, deletePestAlert };
