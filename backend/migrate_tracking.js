// One-time migration: Assign unique tracking numbers to existing shipments
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Shipment = require('./src/models/Shipment');

const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const generateTrackingNumber = async () => {
  let tracking;
  let exists = true;
  while (exists) {
    const random = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    tracking = `SHP-${random}`;
    exists = await Shipment.exists({ trackingNumber: tracking });
  }
  return tracking;
};

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/INT222_Project');
  console.log('Connected to MongoDB.');

  const shipments = await Shipment.find({ trackingNumber: { $exists: false } });
  console.log(`Found ${shipments.length} shipment(s) without a tracking number.`);

  for (const shipment of shipments) {
    const trackingNumber = await generateTrackingNumber();
    await Shipment.findByIdAndUpdate(shipment._id, { trackingNumber });
    console.log(`  Assigned ${trackingNumber} to shipment ${shipment._id}`);
  }

  console.log('Migration complete!');
  await mongoose.disconnect();
};

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
