const SoilReport = require('../models/SoilReport');
const Farm = require('../models/Farm');
const Crop = require('../models/Crop');
const { analyzeSoil } = require('../services/soilService');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');

const canAccessFarm = (farm, user) =>
  user.role === 'admin' || farm.owner.toString() === user._id.toString();

/**
 * POST /api/soil/analyze
 * Accepts soil values, runs rule-based analysis, saves history and updates the crop snapshot.
 */
const analyze = asyncHandler(async (req, res) => {
  const { farm: farmId, crop: cropId, ph, nitrogen, phosphorus, potassium, moisture, soilType } = req.body;

  const farm = await Farm.findById(farmId);
  if (!farm) {
    res.status(404);
    throw new Error('Farm not found');
  }
  if (!canAccessFarm(farm, req.user)) {
    res.status(403);
    throw new Error('You do not have access to this farm');
  }

  if (cropId) {
    const crop = await Crop.findById(cropId);
    if (!crop || crop.farm.toString() !== farm._id.toString()) {
      res.status(400);
      throw new Error('Crop does not belong to the selected farm');
    }
  }

  const values = {
    ph: Number(ph),
    nitrogen: Number(nitrogen),
    phosphorus: Number(phosphorus),
    potassium: Number(potassium),
    moisture: Number(moisture),
    soilType: soilType || farm.soilType
  };
  const analysis = analyzeSoil(values);

  const report = await SoilReport.create({
    farm: farm._id,
    owner: farm.owner,
    crop: cropId || null,
    ...values,
    ...analysis
  });

  if (cropId) {
    await Crop.findByIdAndUpdate(cropId, {
      soilHealth: {
        ph: values.ph,
        nitrogen: values.nitrogen,
        phosphorus: values.phosphorus,
        potassium: values.potassium,
        moisture: values.moisture,
        soilType: values.soilType
      }
    });
  }

  res.status(201).json({
    success: true,
    message: 'Soil analysis complete',
    data: report
  });
});

/**
 * GET /api/soil/reports
 */
const getReports = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.user.role !== 'admin') filter.owner = req.user._id;
  if (req.query.farm) filter.farm = req.query.farm;

  const [reports, total] = await Promise.all([
    SoilReport.find(filter)
      .populate('farm', 'name location')
      .populate('crop', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SoilReport.countDocuments(filter)
  ]);

  res.json({ success: true, data: reports, meta: buildMeta(page, limit, total) });
});

/**
 * GET /api/soil/reports/:id
 */
const getReport = asyncHandler(async (req, res) => {
  const report = await SoilReport.findById(req.params.id)
    .populate('farm', 'name location soilType')
    .populate('crop', 'name season');
  if (!report) {
    res.status(404);
    throw new Error('Soil report not found');
  }
  if (req.user.role !== 'admin' && report.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You do not have access to this report');
  }
  res.json({ success: true, data: report });
});

/**
 * DELETE /api/soil/reports/:id
 */
const deleteReport = asyncHandler(async (req, res) => {
  const report = await SoilReport.findById(req.params.id);
  if (!report) {
    res.status(404);
    throw new Error('Soil report not found');
  }
  if (req.user.role !== 'admin' && report.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You do not have access to this report');
  }
  await report.deleteOne();
  res.json({ success: true, message: 'Soil report deleted' });
});

module.exports = { analyze, getReports, getReport, deleteReport };
