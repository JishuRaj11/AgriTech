const Resource = require('../models/Resource');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');

/**
 * GET /api/resources
 * Farmers only see approved resources; admins can filter by approval state.
 */
const getResources = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.user.role === 'admin') {
    if (req.query.approved !== undefined) filter.isApproved = req.query.approved === 'true';
  } else {
    filter.isApproved = true;
  }

  if (req.query.category) filter.category = req.query.category;
  if (req.query.q) {
    filter.$or = [
      { name: { $regex: req.query.q, $options: 'i' } },
      { description: { $regex: req.query.q, $options: 'i' } }
    ];
  }

  const [resources, total] = await Promise.all([
    Resource.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Resource.countDocuments(filter)
  ]);

  res.json({ success: true, data: resources, meta: buildMeta(page, limit, total) });
});

/**
 * GET /api/resources/:id
 */
const getResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }
  if (!resource.isApproved && req.user.role !== 'admin') {
    res.status(404);
    throw new Error('Resource not found');
  }
  res.json({ success: true, data: resource });
});

/**
 * POST /api/resources (admin)
 */
const createResource = asyncHandler(async (req, res) => {
  const resource = await Resource.create({
    ...req.body,
    isApproved: req.body.isApproved === true,
    createdBy: req.user._id
  });
  res.status(201).json({ success: true, message: 'Resource created', data: resource });
});

/**
 * PUT /api/resources/:id (admin)
 */
const updateResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  ['name', 'category', 'description', 'price', 'unit', 'stock', 'isApproved'].forEach((field) => {
    if (req.body[field] !== undefined) resource[field] = req.body[field];
  });

  await resource.save();
  res.json({ success: true, message: 'Resource updated', data: resource });
});

/**
 * PATCH /api/resources/:id/approve (admin)
 */
const approveResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  resource.isApproved =
    req.body.isApproved === undefined ? !resource.isApproved : Boolean(req.body.isApproved);
  await resource.save();

  res.json({
    success: true,
    message: resource.isApproved ? 'Resource approved' : 'Resource approval removed',
    data: resource
  });
});

/**
 * DELETE /api/resources/:id (admin)
 */
const deleteResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }
  await resource.deleteOne();
  res.json({ success: true, message: 'Resource deleted' });
});

module.exports = {
  getResources,
  getResource,
  createResource,
  updateResource,
  approveResource,
  deleteResource
};
