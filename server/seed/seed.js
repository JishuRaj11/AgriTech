/**
 * Seed script.
 * WARNING: this clears the AgriTech collections before inserting demo data.
 *
 * Usage: npm run seed
 *
 * Demo logins:
 *   Admin  -> admin@agritech.com  / Admin@123
 *   Farmer -> farmer@agritech.com / Farmer@123
 *   Farmer -> meena@agritech.com  / Farmer@123
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { analyzeSoil } = require('../services/soilService');

const User = require('../models/User');
const Farm = require('../models/Farm');
const Crop = require('../models/Crop');
const SoilReport = require('../models/SoilReport');
const Resource = require('../models/Resource');
const Order = require('../models/Order');
const PestAlert = require('../models/PestAlert');
const Consultation = require('../models/Consultation');
const ForumPost = require('../models/ForumPost');
const WeatherData = require('../models/WeatherData');

const daysFromNow = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const run = async () => {
  await connectDB();
  console.log('Clearing existing AgriTech data...');
  await Promise.all([
    User.deleteMany({}),
    Farm.deleteMany({}),
    Crop.deleteMany({}),
    SoilReport.deleteMany({}),
    Resource.deleteMany({}),
    Order.deleteMany({}),
    PestAlert.deleteMany({}),
    Consultation.deleteMany({}),
    ForumPost.deleteMany({}),
    WeatherData.deleteMany({})
  ]);

  console.log('Creating users...');
  const admin = await User.create({
    name: 'AgriTech Admin',
    email: 'admin@agritech.com',
    password: 'Admin@123',
    role: 'admin',
    language: 'en',
    location: 'New Delhi'
  });

  const farmer = await User.create({
    name: 'Ravi Kumar',
    email: 'farmer@agritech.com',
    password: 'Farmer@123',
    role: 'farmer',
    language: 'en',
    location: 'Coimbatore'
  });

  const farmer2 = await User.create({
    name: 'Meena Sharma',
    email: 'meena@agritech.com',
    password: 'Farmer@123',
    role: 'farmer',
    language: 'hi',
    location: 'Nashik'
  });

  console.log('Creating farms and crops...');
  const farm = await Farm.create({
    owner: farmer._id,
    name: 'Green Valley Farm',
    location: 'Coimbatore, Tamil Nadu',
    size: 4.5,
    sizeUnit: 'acre',
    soilType: 'loamy',
    notes: 'Main demonstration farm with drip irrigation.',
    activityLogs: [
      { message: 'Farm created by seed script' },
      { message: 'Installed drip irrigation' }
    ]
  });

  const farm2 = await Farm.create({
    owner: farmer2._id,
    name: 'Sunrise Fields',
    location: 'Nashik, Maharashtra',
    size: 6,
    sizeUnit: 'acre',
    soilType: 'clay',
    notes: 'Grape and onion farm.',
    activityLogs: [{ message: 'Farm created by seed script' }]
  });

  const crops = await Crop.insertMany([
    {
      farm: farm._id,
      owner: farmer._id,
      name: 'Rice',
      season: 'Kharif',
      plantingDate: daysFromNow(-40),
      harvestDate: daysFromNow(80),
      status: 'growing',
      soilHealth: { ph: 6.7, nitrogen: 320, phosphorus: 30, potassium: 210, moisture: 62, soilType: 'loamy' },
      growthNotes: [{ note: 'Healthy tillering stage observed.' }, { note: 'Applied organic compost.' }]
    },
    {
      farm: farm._id,
      owner: farmer._id,
      name: 'Tomato',
      season: 'Rabi',
      plantingDate: daysFromNow(-15),
      harvestDate: daysFromNow(60),
      status: 'growing',
      soilHealth: { ph: 6.2, nitrogen: 280, phosphorus: 22, potassium: 180, moisture: 48, soilType: 'loamy' }
    },
    {
      farm: farm._id,
      owner: farmer._id,
      name: 'Maize',
      season: 'Kharif',
      plantingDate: daysFromNow(-120),
      harvestDate: daysFromNow(-10),
      status: 'harvested',
      soilHealth: { ph: 7.1, nitrogen: 300, phosphorus: 26, potassium: 200, moisture: 55, soilType: 'loamy' }
    },
    {
      farm: farm2._id,
      owner: farmer2._id,
      name: 'Onion',
      season: 'Rabi',
      plantingDate: daysFromNow(-30),
      harvestDate: daysFromNow(75),
      status: 'growing',
      soilHealth: { ph: 7.8, nitrogen: 240, phosphorus: 20, potassium: 140, moisture: 70, soilType: 'clay' }
    }
  ]);

  console.log('Creating soil reports...');
  const soilSamples = [
    { farm: farm, crop: crops[0], ph: 6.7, nitrogen: 320, phosphorus: 30, potassium: 210, moisture: 62, soilType: 'loamy' },
    { farm: farm, crop: crops[1], ph: 6.1, nitrogen: 240, phosphorus: 22, potassium: 160, moisture: 45, soilType: 'loamy' },
    { farm: farm2, crop: crops[3], ph: 7.9, nitrogen: 210, phosphorus: 18, potassium: 130, moisture: 72, soilType: 'clay' }
  ];

  for (const sample of soilSamples) {
    const values = {
      ph: sample.ph,
      nitrogen: sample.nitrogen,
      phosphorus: sample.phosphorus,
      potassium: sample.potassium,
      moisture: sample.moisture,
      soilType: sample.soilType
    };
    const analysis = analyzeSoil(values);
    await SoilReport.create({
      farm: sample.farm._id,
      owner: sample.farm.owner,
      crop: sample.crop._id,
      ...values,
      ...analysis
    });
  }

  console.log('Creating resources...');
  const resources = await Resource.insertMany([
    {
      name: 'Hybrid Rice Seeds (1 kg)',
      category: 'seeds',
      description: 'High-yield, disease-resistant rice seed suitable for Kharif season.',
      price: 320,
      unit: 'kg',
      stock: 120,
      isApproved: true,
      createdBy: admin._id
    },
    {
      name: 'Organic Vermicompost (25 kg)',
      category: 'fertilizer',
      description: 'Nutrient-rich organic compost that improves soil structure.',
      price: 450,
      unit: 'bag',
      stock: 80,
      isApproved: true,
      createdBy: admin._id
    },
    {
      name: 'NPK 19:19:19 Fertilizer (1 kg)',
      category: 'fertilizer',
      description: 'Water-soluble balanced fertilizer for vegetative growth.',
      price: 180,
      unit: 'kg',
      stock: 200,
      isApproved: true,
      createdBy: admin._id
    },
    {
      name: 'Neem Oil Pest Spray (500 ml)',
      category: 'pesticide',
      description: 'Organic neem-based spray for common sucking pests.',
      price: 260,
      unit: 'bottle',
      stock: 60,
      isApproved: true,
      createdBy: admin._id
    },
    {
      name: 'Drip Irrigation Starter Kit',
      category: 'tool',
      description: 'Complete drip kit for one acre, saves water and improves yield.',
      price: 2400,
      unit: 'kit',
      stock: 15,
      isApproved: true,
      createdBy: admin._id
    },
    {
      name: 'Soil pH Testing Kit',
      category: 'tool',
      description: 'Quick field test kit for pH, nitrogen, phosphorus and potassium.',
      price: 899,
      unit: 'kit',
      stock: 25,
      isApproved: false,
      createdBy: admin._id
    }
  ]);

  console.log('Creating pest alerts...');
  await PestAlert.insertMany([
    {
      title: 'Rice Blast Alert',
      crop: 'Rice',
      symptoms: 'Diamond-shaped grey lesions on leaves, neck rot and reduced grain filling.',
      season: 'Kharif',
      region: 'Tamil Nadu',
      treatment: 'Use resistant varieties, avoid excess nitrogen, and spray a recommended fungicide.',
      severity: 'high',
      isActive: true,
      createdBy: admin._id
    },
    {
      title: 'Tomato Leaf Miner',
      crop: 'Tomato',
      symptoms: 'Serpentine white trails on leaves, reduced photosynthesis and leaf drop.',
      season: 'Rabi',
      region: 'All regions',
      treatment: 'Install yellow sticky traps, remove affected leaves and apply neem oil spray.',
      severity: 'medium',
      isActive: true,
      createdBy: admin._id
    },
    {
      title: 'Onion Thrips Warning',
      crop: 'Onion',
      symptoms: 'Silvery streaks on leaves, curled tips and stunted bulb growth.',
      season: 'Rabi',
      region: 'Maharashtra',
      treatment: 'Use blue sticky traps, maintain field moisture and rotate insecticides.',
      severity: 'high',
      isActive: true,
      createdBy: admin._id
    },
    {
      title: 'Fall Armyworm in Maize',
      crop: 'Maize',
      symptoms: 'Ragged holes on leaves and sawdust-like frass in the whorl.',
      season: 'Kharif',
      region: 'All regions',
      treatment: 'Scout regularly, hand-pick larvae and apply bio-pesticides such as Bt.',
      severity: 'high',
      isActive: true,
      createdBy: admin._id
    },
    {
      title: 'Wheat Rust Advisory',
      crop: 'Wheat',
      symptoms: 'Orange-brown powdery pustules on leaves and stems.',
      season: 'Rabi',
      region: 'Punjab',
      treatment: 'Sow resistant varieties and apply fungicide at first sign of infection.',
      severity: 'medium',
      isActive: true,
      createdBy: admin._id
    }
  ]);

  console.log('Creating orders...');
  await Order.insertMany([
    {
      user: farmer._id,
      items: [
        { resource: resources[0]._id, name: resources[0].name, price: resources[0].price, quantity: 2 },
        { resource: resources[1]._id, name: resources[1].name, price: resources[1].price, quantity: 1 }
      ],
      totalAmount: resources[0].price * 2 + resources[1].price,
      deliveryAddress: '12 Lake View Road, Coimbatore, Tamil Nadu',
      status: 'pending'
    },
    {
      user: farmer2._id,
      items: [
        { resource: resources[3]._id, name: resources[3].name, price: resources[3].price, quantity: 2 }
      ],
      totalAmount: resources[3].price * 2,
      deliveryAddress: '45 Market Street, Nashik, Maharashtra',
      status: 'delivered',
      approvedAt: daysFromNow(-8),
      deliveredAt: daysFromNow(-5)
    }
  ]);

  console.log('Creating consultations...');
  await Consultation.create({
    farmer: farmer._id,
    crop: 'Rice',
    question: 'My rice leaves have grey diamond-shaped spots. Is this rice blast and how should I treat it?',
    reply: 'Yes, this sounds like rice blast. Reduce nitrogen application, ensure good drainage, and spray tricyclazole as per label guidance. Remove severely infected leaves.',
    status: 'answered',
    repliedBy: admin._id,
    repliedAt: daysFromNow(-2)
  });

  await Consultation.create({
    farmer: farmer2._id,
    crop: 'Onion',
    question: 'Onion leaves are curling and showing silvery streaks. What pest could this be?',
    status: 'open'
  });

  console.log('Creating forum posts...');
  const post = await ForumPost.create({
    author: farmer._id,
    title: 'Best time to irrigate tomato plants in summer?',
    content:
      'Temperatures are crossing 35°C here. Should I irrigate tomato plants early in the morning or in the evening? Any mulching advice?',
    category: 'Crops'
  });
  post.comments.push({
    author: farmer2._id,
    content: 'Early morning works best for us. We also spread paddy straw mulch to keep the soil cool.'
  });
  await post.save();

  await ForumPost.create({
    author: farmer2._id,
    title: 'Looking for organic ways to control onion thrips',
    content:
      'Has anyone tried blue sticky traps and neem oil together? I want to avoid chemical sprays this season.',
    category: 'Pests'
  });

  console.log('\nSeed complete!');
  console.log('---------------------------------------');
  console.log('Admin   : admin@agritech.com  / Admin@123');
  console.log('Farmer  : farmer@agritech.com / Farmer@123');
  console.log('Farmer  : meena@agritech.com  / Farmer@123');
  console.log('---------------------------------------');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch(async (error) => {
  console.error('Seed failed:', error);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
