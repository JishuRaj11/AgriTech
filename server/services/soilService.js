/**
 * Rule-based soil health analysis and crop/fertilizer recommendations.
 * Values use common agronomy thresholds and are meant as guidance, not lab-grade advice.
 */

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getHealthLabel = (score) => {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  return 'poor';
};

const recommendCrops = (ph, soilType) => {
  const crops = new Set();

  if (ph < 5.8) {
    ['Tea', 'Potato', 'Maize', 'Millet', 'Pineapple'].forEach((c) => crops.add(c));
  } else if (ph <= 7.5) {
    ['Wheat', 'Rice', 'Maize', 'Tomato', 'Vegetables', 'Pulses', 'Sugarcane'].forEach((c) => crops.add(c));
  } else {
    ['Cotton', 'Barley', 'Mustard', 'Chickpea', 'Sugarcane'].forEach((c) => crops.add(c));
  }

  if (soilType === 'sandy') {
    ['Groundnut', 'Millet', 'Watermelon', 'Potato'].forEach((c) => crops.add(c));
  } else if (soilType === 'clay') {
    ['Rice', 'Sugarcane', 'Wheat', 'Cotton'].forEach((c) => crops.add(c));
  } else if (soilType === 'silt') {
    ['Wheat', 'Rice', 'Vegetables', 'Sugarcane'].forEach((c) => crops.add(c));
  } else if (soilType === 'loamy') {
    ['Wheat', 'Maize', 'Pulses', 'Vegetables'].forEach((c) => crops.add(c));
  }

  return Array.from(crops).slice(0, 8);
};

const analyzeSoil = ({ ph, nitrogen, phosphorus, potassium, moisture, soilType }) => {
  let score = 100;
  const fertilizers = [];
  const notes = [];

  if (ph >= 6.0 && ph <= 7.5) {
    notes.push('Soil pH is in the ideal range for most crops.');
  } else if (ph < 6.0) {
    score -= clamp((6.0 - ph) * 12, 8, 30);
    fertilizers.push('Apply agricultural lime to raise pH.');
    notes.push('Soil is acidic. Lime application and organic matter will help.');
  } else {
    score -= clamp((ph - 7.5) * 10, 8, 30);
    fertilizers.push('Apply gypsum and organic compost to lower pH.');
    notes.push('Soil is alkaline. Gypsum and green manure can improve nutrient availability.');
  }

  if (nitrogen < 250) {
    score -= 15;
    fertilizers.push('Low nitrogen: apply urea or well-rotted compost.');
  } else if (nitrogen > 560) {
    score -= 5;
    notes.push('Nitrogen is high. Avoid excess urea to prevent leaching.');
  }

  if (phosphorus < 25) {
    score -= 15;
    fertilizers.push('Low phosphorus: apply DAP or bone meal.');
  } else if (phosphorus > 50) {
    score -= 5;
    notes.push('Phosphorus is high. Reduce phosphate fertilizer this season.');
  }

  if (potassium < 150) {
    score -= 15;
    fertilizers.push('Low potassium: apply muriate of potash or wood ash.');
  } else if (potassium > 300) {
    score -= 5;
    notes.push('Potassium is high. Avoid additional potash.');
  }

  if (moisture < 35) {
    score -= 12;
    fertilizers.push('Moisture is low: add mulch and consider drip irrigation.');
    notes.push('Irrigate early morning or evening to reduce evaporation.');
  } else if (moisture > 75) {
    score -= 12;
    notes.push('Moisture is high. Improve drainage to avoid root rot.');
  } else {
    notes.push('Soil moisture is at a healthy level.');
  }

  if (soilType === 'sandy') {
    notes.push('Sandy soil drains quickly: add organic matter and irrigate more often.');
  } else if (soilType === 'clay') {
    notes.push('Clay soil holds water: avoid over-irrigation and improve aeration.');
  } else if (soilType === 'loamy') {
    notes.push('Loamy soil is well balanced for most crops.');
  }

  if (fertilizers.length === 0) {
    fertilizers.push('Maintain current practice with balanced organic compost.');
  }
  if (notes.length === 0) {
    notes.push('Soil looks healthy. Keep monitoring after each season.');
  }

  const healthScore = clamp(Math.round(score), 0, 100);

  return {
    healthScore,
    healthLabel: getHealthLabel(healthScore),
    recommendations: {
      crops: recommendCrops(ph, soilType),
      fertilizers,
      notes
    }
  };
};

module.exports = { analyzeSoil };
