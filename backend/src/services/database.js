const mongoose = require('mongoose');

const connectDatabase = async () => {
  const connectionString = process.env.DATABASE_URL || process.env.MONGODB_URI;

  if (!connectionString) {
    throw new Error('DATABASE_URL or MONGODB_URI must be set to connect to MongoDB.');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(connectionString);
  console.log('MongoDB connected');
};

module.exports = connectDatabase;
