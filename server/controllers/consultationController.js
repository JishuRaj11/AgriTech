const Consultation = require('../models/Consultation');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');

const canAccess = (consultation, user) =>
  user.role === 'admin' || consultation.farmer.toString() === user._id.toString();

/**
 * POST /api/consultations (farmer)
 */
const createConsultation = asyncHandler(async (req, res) => {
  const consultation = await Consultation.create({
    farmer: req.user._id,
    crop: req.body.crop || '',
    question: req.body.question
  });
  res.status(201).json({ success: true, message: 'Question submitted', data: consultation });
});

/**
 * GET /api/consultations
 */
const getConsultations = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.user.role !== 'admin') filter.farmer = req.user._id;
  if (req.query.status) filter.status = req.query.status;

  const [consultations, total] = await Promise.all([
    Consultation.find(filter)
      .populate('farmer', 'name email location')
      .populate('repliedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Consultation.countDocuments(filter)
  ]);

  res.json({ success: true, data: consultations, meta: buildMeta(page, limit, total) });
});

/**
 * GET /api/consultations/:id
 */
const getConsultation = asyncHandler(async (req, res) => {
  const consultation = await Consultation.findById(req.params.id)
    .populate('farmer', 'name email location')
    .populate('repliedBy', 'name');
  if (!consultation) {
    res.status(404);
    throw new Error('Consultation not found');
  }
  if (!canAccess(consultation, req.user)) {
    res.status(403);
    throw new Error('You do not have access to this consultation');
  }
  res.json({ success: true, data: consultation });
});

/**
 * PATCH /api/consultations/:id/reply (admin)
 */
const replyConsultation = asyncHandler(async (req, res) => {
  const consultation = await Consultation.findById(req.params.id);
  if (!consultation) {
    res.status(404);
    throw new Error('Consultation not found');
  }

  consultation.reply = req.body.reply;
  consultation.repliedBy = req.user._id;
  consultation.repliedAt = new Date();
  consultation.status = req.body.close === true ? 'closed' : 'answered';

  await consultation.save();
  const populated = await consultation.populate([
    { path: 'farmer', select: 'name email location' },
    { path: 'repliedBy', select: 'name' }
  ]);

  res.json({ success: true, message: 'Reply sent', data: populated });
});

/**
 * DELETE /api/consultations/:id (owner or admin)
 */
const deleteConsultation = asyncHandler(async (req, res) => {
  const consultation = await Consultation.findById(req.params.id);
  if (!consultation) {
    res.status(404);
    throw new Error('Consultation not found');
  }
  if (!canAccess(consultation, req.user)) {
    res.status(403);
    throw new Error('You do not have access to this consultation');
  }
  await consultation.deleteOne();
  res.json({ success: true, message: 'Consultation deleted' });
});

module.exports = {
  createConsultation,
  getConsultations,
  getConsultation,
  replyConsultation,
  deleteConsultation
};
