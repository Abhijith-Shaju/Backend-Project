const prisma = require('../services/prisma');

const getDashboardStats = async (req, res) => {
  try {
    const totalShipments = await prisma.shipment.count();
    const deliveredShipments = await prisma.shipment.count({ where: { status: 'DELIVERED' } });
    const pendingShipments = await prisma.shipment.count({ where: { status: 'PENDING' } });
    const inTransitShipments = await prisma.shipment.count({ where: { status: 'IN_TRANSIT' } });
    const activeDrivers = await prisma.driver.count({ where: { status: 'AVAILABLE' } });
    
    const warehouses = await prisma.warehouse.findMany({
      select: { name: true, capacity: true, currentUsage: true }
    });

    const deliveryTrends = await prisma.shipment.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    res.status(200).json({
      summary: {
        totalShipments,
        deliveredShipments,
        pendingShipments,
        inTransitShipments,
        activeDrivers
      },
      warehouses,
      deliveryTrends
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
};

module.exports = { getDashboardStats };
