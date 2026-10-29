const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Connect to MongoDB. Supports local MongoDB and MongoDB Atlas.
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agritech';
  mongoose.set('strictQuery', true);
  const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
};

module.exports = connectDB;
