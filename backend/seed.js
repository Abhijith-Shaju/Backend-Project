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

  const adminPassword = await bcrypt.hash('admin123', 10);
  await User.create({
    name: 'System Admin',
    email: 'admin@logiflow.com',
    password: adminPassword,
    role: 'ADMIN'
  });

  const w1 = await Warehouse.create({
    name: 'North Central Hub',
    locationName: 'Chicago, IL',
    lat: 41.8781,
    lng: -87.6298,
    capacity: 50000,
    currentUsage: 0
  });

  const w2 = await Warehouse.create({
    name: 'West Coast Gateway',
    locationName: 'Los Angeles, CA',
    lat: 34.0522,
    lng: -118.2437,
    capacity: 35000,
    currentUsage: 0
  });

  const d1 = await Driver.create({
    name: 'Michael Scott',
    phone: '555-0101',
    vehicleNumber: 'TRUCK-7788',
    status: 'ON_DELIVERY'
  });

  const d2 = await Driver.create({
    name: 'Pam Beesly',
    phone: '555-0102',
    vehicleNumber: 'VAN-9922',
    status: 'ON_DELIVERY'
  });

  await Driver.create({
    name: 'Jim Halpert',
    phone: '555-0103',
    vehicleNumber: 'TRUCK-2145',
    status: 'AVAILABLE'
  });

  const seededShipments = [
    {
      source: 'Chicago Hub',
      destination: 'Detroit, MI',
      weight: 450.5,
      priority: 'High',
      status: 'IN_TRANSIT',
      warehouseId: w1.id,
      driverId: d1.id
    },
    {
      source: 'LA Gateway',
      destination: 'Phoenix, AZ',
      weight: 1200,
      priority: 'Normal',
      status: 'PACKED',
      warehouseId: w2.id,
      driverId: d2.id
    },
    {
      source: 'Chicago Hub',
      destination: 'Milwaukee, WI',
      weight: 320,
      priority: 'Low',
      status: 'PENDING',
      warehouseId: w1.id,
      driverId: null
    }
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
