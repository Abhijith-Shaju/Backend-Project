const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./src/models/User');
const Warehouse = require('./src/models/Warehouse');
const Driver = require('./src/models/Driver');
const Shipment = require('./src/models/Shipment');
const DeliveryLog = require('./src/models/DeliveryLog');

dotenv.config();

async function main() {
  const connectionString = process.env.DATABASE_URL || process.env.MONGODB_URI;
  if (!connectionString) {
    throw new Error('DATABASE_URL or MONGODB_URI must be set to seed MongoDB.');
  }

  await mongoose.connect(connectionString);

  await Promise.all([
    DeliveryLog.deleteMany({}),
    Shipment.deleteMany({}),
    Warehouse.deleteMany({}),
    Driver.deleteMany({}),
    User.deleteMany({})
  ]);
  
  try {
    await Shipment.collection.dropIndexes();
  } catch (err) {
    // Ignore if collection doesn't exist
  }

  const adminPassword = await bcrypt.hash('admin123', 10);
  await User.create({
    name: 'System Admin',
    email: 'admin@logiflow.com',
    password: adminPassword,
    role: 'ADMIN'
  });

  const w1 = await Warehouse.create({ name: 'North Central Hub', locationName: 'Chicago, IL', lat: 41.8781, lng: -87.6298, capacity: 50000, currentUsage: 0 });
  const w2 = await Warehouse.create({ name: 'West Coast Gateway', locationName: 'Los Angeles, CA', lat: 34.0522, lng: -118.2437, capacity: 35000, currentUsage: 0 });
  const w3 = await Warehouse.create({ name: 'East Coast Terminal', locationName: 'New York, NY', lat: 40.7128, lng: -74.0060, capacity: 60000, currentUsage: 0 });
  const w4 = await Warehouse.create({ name: 'Southern Distribution', locationName: 'Dallas, TX', lat: 32.7767, lng: -96.7970, capacity: 40000, currentUsage: 0 });

  const d1 = await Driver.create({ name: 'Michael Scott', phone: '555-0101', vehicleNumber: 'TRUCK-7788', status: 'ON_DELIVERY' });
  const d2 = await Driver.create({ name: 'Pam Beesly', phone: '555-0102', vehicleNumber: 'VAN-9922', status: 'ON_DELIVERY' });
  const d3 = await Driver.create({ name: 'Jim Halpert', phone: '555-0103', vehicleNumber: 'TRUCK-2145', status: 'AVAILABLE' });
  const d4 = await Driver.create({ name: 'Dwight Schrute', phone: '555-0104', vehicleNumber: 'TRUCK-9999', status: 'ON_DELIVERY' });
  
  const seededShipments = [
    // Driver 1 (Michael) - Large batch to test Route Optimization sorting
    { source: 'Chicago Hub', destination: 'Detroit, MI', weight: 450, priority: 'Normal', status: 'IN_TRANSIT', warehouseId: w1.id, driverId: d1.id },
    { source: 'Chicago Hub', destination: 'Cleveland, OH', weight: 800, priority: 'High', status: 'PACKED', warehouseId: w1.id, driverId: d1.id },
    { source: 'Chicago Hub', destination: 'Indianapolis, IN', weight: 150, priority: 'Low', status: 'IN_TRANSIT', warehouseId: w1.id, driverId: d1.id },
    { source: 'Chicago Hub', destination: 'Columbus, OH', weight: 1200, priority: 'Urgent', status: 'PACKED', warehouseId: w1.id, driverId: d1.id },
    { source: 'Chicago Hub', destination: 'St. Louis, MO', weight: 600, priority: 'Normal', status: 'IN_TRANSIT', warehouseId: w1.id, driverId: d1.id },
    { source: 'Chicago Hub', destination: 'Milwaukee, WI', weight: 300, priority: 'Low', status: 'PACKED', warehouseId: w1.id, driverId: d1.id },
    { source: 'Chicago Hub', destination: 'Cincinnati, OH', weight: 950, priority: 'High', status: 'IN_TRANSIT', warehouseId: w1.id, driverId: d1.id },

    // Driver 2 (Pam)
    { source: 'LA Gateway', destination: 'Phoenix, AZ', weight: 1200, priority: 'Normal', status: 'PACKED', warehouseId: w2.id, driverId: d2.id },
    { source: 'LA Gateway', destination: 'Las Vegas, NV', weight: 500, priority: 'High', status: 'IN_TRANSIT', warehouseId: w2.id, driverId: d2.id },

    // Driver 4 (Dwight)
    { source: 'Dallas, TX', destination: 'Houston, TX', weight: 2000, priority: 'Urgent', status: 'IN_TRANSIT', warehouseId: w4.id, driverId: d4.id },
    { source: 'Dallas, TX', destination: 'Austin, TX', weight: 400, priority: 'Normal', status: 'PACKED', warehouseId: w4.id, driverId: d4.id },

    // Unassigned Shipments
    { source: 'New York, NY', destination: 'Boston, MA', weight: 700, priority: 'High', status: 'PENDING', warehouseId: w3.id, driverId: null },
    { source: 'New York, NY', destination: 'Philadelphia, PA', weight: 250, priority: 'Low', status: 'PENDING', warehouseId: w3.id, driverId: null },
    { source: 'Dallas, TX', destination: 'San Antonio, TX', weight: 850, priority: 'Normal', status: 'PENDING', warehouseId: w4.id, driverId: null },
  ];

  const shipments = await Shipment.create(seededShipments);

  await Promise.all(
    shipments.map((shipment) => (
      Warehouse.findByIdAndUpdate(shipment.warehouseId, { $inc: { currentUsage: shipment.weight } })
    ))
  );

  await DeliveryLog.create(
    shipments.map((shipment) => ({
      shipmentId: shipment.id,
      status: shipment.status,
      notes: 'Shipment created'
    }))
  );

  console.log('Seed data created successfully');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
