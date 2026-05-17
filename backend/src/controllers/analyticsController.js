const Shipment = require('../models/Shipment');
const Driver = require('../models/Driver');
const Warehouse = require('../models/Warehouse');

const getDashboardStats = async (req, res) => {
  try {
    const totalShipments = await Shipment.countDocuments();
    const deliveredShipments = await Shipment.countDocuments({ status: 'DELIVERED' });
    const pendingShipments = await Shipment.countDocuments({ status: 'PENDING' });
    const inTransitShipments = await Shipment.countDocuments({ status: 'IN_TRANSIT' });
    const activeDrivers = await Driver.countDocuments({ status: 'AVAILABLE' });
    
    const warehouses = await Warehouse.find({}, { name: 1, capacity: 1, currentUsage: 1 });

    const deliveryTrends = await Shipment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', _count: { id: '$count' } } }
    ]);

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
