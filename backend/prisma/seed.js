const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  // Create Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@logiflow.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@logiflow.com',
      password: adminPassword,
      role: 'ADMIN'
    }
  });

  // Create Warehouses
  const w1 = await prisma.warehouse.create({
    data: {
      name: 'North Central Hub',
      locationName: 'Chicago, IL',
      lat: 41.8781,
      lng: -87.6298,
      capacity: 50000,
      currentUsage: 12000
    }
  });

  const w2 = await prisma.warehouse.create({
    data: {
      name: 'West Coast Gateway',
      locationName: 'Los Angeles, CA',
      lat: 34.0522,
      lng: -118.2437,
      capacity: 35000,
      currentUsage: 28000
    }
  });

  // Create Drivers
  const d1 = await prisma.driver.create({
    data: {
      name: 'Michael Scott',
      phone: '555-0101',
      vehicleNumber: 'TRUCK-7788',
      status: 'AVAILABLE'
    }
  });

  const d2 = await prisma.driver.create({
    data: {
      name: 'Pam Beesly',
      phone: '555-0102',
      vehicleNumber: 'VAN-9922',
      status: 'ON_DELIVERY'
    }
  });

  // Create Shipments
  await prisma.shipment.create({
    data: {
      source: 'Chicago Hub',
      destination: 'Detroit, MI',
      weight: 450.5,
      priority: 'High',
      status: 'IN_TRANSIT',
      warehouseId: w1.id,
      driverId: d1.id
    }
  });

  await prisma.shipment.create({
    data: {
      source: 'LA Gateway',
      destination: 'Phoenix, AZ',
      weight: 1200.0,
      priority: 'Normal',
      status: 'PENDING',
      warehouseId: w2.id
    }
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
