const Shipment = require('../models/Shipment');
const Warehouse = require('../models/Warehouse');
const Driver = require('../models/Driver');
const DeliveryLog = require('../models/DeliveryLog');

// Generates a unique, human-readable tracking number like SHP-A1B2C3D4
const generateTrackingNumber = async () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let tracking;
  let exists = true;
  while (exists) {
    const random = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    tracking = `SHP-${random}`;
    exists = await Shipment.exists({ trackingNumber: tracking });
  }
  return tracking;
};

const populateShipment = (query) => query.populate('driver').populate('warehouse');

const releaseDriverIfIdle = async (driverId, excludedShipmentId) => {
  if (!driverId) return;

  const activeShipments = await Shipment.countDocuments({
    driverId,
    _id: { $ne: excludedShipmentId },
    status: { $in: ['PACKED', 'IN_TRANSIT', 'QUEUED'] }
  });

  if (activeShipments === 0) {
    await Driver.findByIdAndUpdate(driverId, { status: 'AVAILABLE' });
  }
};

const getShipmentWithRelations = async (id) => {
  const shipment = await populateShipment(Shipment.findById(id));
  if (!shipment) return null;

  const deliveryLogs = await DeliveryLog.find({ shipmentId: id }).sort({ timestamp: 1 });
  return { ...shipment.toJSON(), deliveryLogs };
};

const getAllShipments = async (req, res) => {
  try {
    const shipments = await populateShipment(Shipment.find().sort({ createdAt: -1 }));
    res.status(200).json(shipments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shipments', error: error.message });
  }
};

const getShipmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const shipment = await getShipmentWithRelations(id);
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });
    res.status(200).json(shipment);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shipment', error: error.message });
  }
};

const createShipment = async (req, res) => {
  try {
    const { source, destination, weight, priority, warehouseId, driverId } = req.body;
    const shipmentWeight = Number(weight);

    if (!source || !destination || !Number.isFinite(shipmentWeight) || shipmentWeight <= 0) {
      return res.status(400).json({ message: 'Source, destination, and a valid weight are required.' });
    }

    // Strict Source Mapping: The storage warehouse is always the source warehouse
    const sourceWarehouse = await Warehouse.findOne({ name: source.trim() });
    if (!sourceWarehouse) {
      throw new Error('Source warehouse not found in the database.');
    }
    
    // We also validate destination warehouse exists
    const destWarehouse = await Warehouse.findOne({ name: destination.trim() });
    if (!destWarehouse) {
      throw new Error('Destination warehouse not found in the database.');
    }

    if (sourceWarehouse.currentUsage + shipmentWeight > sourceWarehouse.capacity) {
      throw new Error('Source warehouse does not have enough available capacity.');
    }
    
    const finalWarehouseId = sourceWarehouse._id;

    if (driverId) {
      const driver = await Driver.findById(driverId);
      if (!driver) throw new Error('Selected driver was not found.');
    }

    const trackingNumber = await generateTrackingNumber();

    const createdShipment = await Shipment.create({
      source: source.trim(),
      destination: destination.trim(),
      weight: shipmentWeight,
      priority: priority || 'Normal',
      warehouseId: finalWarehouseId,
      driverId: driverId || null,
      status: driverId ? 'QUEUED' : 'PENDING',
      trackingNumber
    });

    await DeliveryLog.create({
      shipmentId: createdShipment.id,
      status: createdShipment.status,
      notes: 'Shipment created'
    });

    if (finalWarehouseId && !driverId) {
      await Warehouse.findByIdAndUpdate(finalWarehouseId, { $inc: { currentUsage: shipmentWeight } });
    }

    if (driverId) {
      await Driver.findByIdAndUpdate(driverId, { status: 'ON_DELIVERY' });
      await dispatchNextShipment(driverId);
    }

    const shipment = await getShipmentWithRelations(createdShipment.id);
    res.status(201).json(shipment);
  } catch (error) {
    res.status(400).json({ message: 'Error creating shipment', error: error.message });
  }
};

const updateShipmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, driverId } = req.body;

    const existing = await Shipment.findById(id);
    if (!existing) return res.status(404).json({ message: 'Shipment not found.' });

    if (driverId) {
      const driver = await Driver.findById(driverId);
      if (!driver) throw new Error('Selected driver was not found.');
    }

    const updateData = { status };
    if (driverId !== undefined) updateData.driverId = driverId || null;
    if (status === 'DELIVERED') updateData.deliveryDate = new Date();

    const updatedShipment = await Shipment.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    // DATA INTEGRITY: Adjust warehouse capacity if shipment leaves or returns
    if (existing.warehouseId && status && status !== existing.status) {
      const wasInside = existing.status === 'PENDING' || existing.status === 'PACKED';
      const isOutside = status === 'IN_TRANSIT' || status === 'DELIVERED';
      
      const wasOutside = existing.status === 'IN_TRANSIT' || existing.status === 'DELIVERED';
      const isInside = status === 'PENDING' || status === 'PACKED';

      if (wasInside && isOutside) {
        // Left the source warehouse, free up capacity
        await Warehouse.findByIdAndUpdate(existing.warehouseId, { $inc: { currentUsage: -existing.weight } });
      } else if (wasOutside && isInside) {
        // Returned to source warehouse, consume capacity
        await Warehouse.findByIdAndUpdate(existing.warehouseId, { $inc: { currentUsage: existing.weight } });
      }
      
      // Destination warehouse capacity update upon arrival or rollback
      if (status === 'DELIVERED' && existing.status !== 'DELIVERED') {
        const destWarehouse = await Warehouse.findOne({ name: existing.destination });
        if (destWarehouse) {
          await Warehouse.findByIdAndUpdate(destWarehouse._id, { $inc: { currentUsage: existing.weight } });
        }
      } else if (existing.status === 'DELIVERED' && status !== 'DELIVERED') {
        const destWarehouse = await Warehouse.findOne({ name: existing.destination });
        if (destWarehouse) {
          await Warehouse.findByIdAndUpdate(destWarehouse._id, { $inc: { currentUsage: -existing.weight } });
        }
      }
    }

    await DeliveryLog.create({
      shipmentId: updatedShipment.id,
      status,
      notes: notes || `Status updated to ${status}`
    });

    if (driverId && status !== 'DELIVERED') {
      await Driver.findByIdAndUpdate(driverId, { status: 'ON_DELIVERY' });
      await dispatchNextShipment(driverId);
    }

    if (status === 'DELIVERED') {
      await releaseDriverIfIdle(updatedShipment.driverId, id);
      await dispatchNextShipment(updatedShipment.driverId);
    } else if (existing.driverId && driverId !== undefined && existing.driverId.toString() !== String(driverId || '')) {
      await releaseDriverIfIdle(existing.driverId, id);
    }

    const shipment = await getShipmentWithRelations(updatedShipment.id);
    res.status(200).json(shipment);
  } catch (error) {
    res.status(400).json({ message: 'Error updating shipment status', error: error.message });
  }
};

const deleteShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const shipment = await Shipment.findByIdAndDelete(id);
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });

    // DATA INTEGRITY: Free warehouse capacity if shipment was still taking up space
    if (shipment.warehouseId && (shipment.status === 'PENDING' || shipment.status === 'PACKED')) {
      await Warehouse.findByIdAndUpdate(shipment.warehouseId, { $inc: { currentUsage: -shipment.weight } });
    }

    await DeliveryLog.deleteMany({ shipmentId: id });
    res.status(200).json({ message: 'Shipment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting shipment', error: error.message });
  }
};

// Helper to calculate Haversine distance in km between two lat/lng points
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
};

// Helper to get the optimal sequence using Nearest-Neighbor
const getOptimizedSequence = async (shipments) => {
  if (!shipments.length) return [];
  
  const warehouseNames = [...new Set([
    ...shipments.map(s => s.source),
    ...shipments.map(s => s.destination)
  ])];
  
  const warehouses = await Warehouse.find({ name: { $in: warehouseNames } });
  const warehouseMap = {};
  warehouses.forEach(w => {
    warehouseMap[w.name] = { lat: w.lat, lng: w.lng };
  });

  const priorityWeight = { 'Urgent': 4, 'High': 3, 'Normal': 2, 'Low': 1 };
  
  const sortedByPriority = shipments.sort((a, b) => {
    const pA = priorityWeight[a.priority] || 2;
    const pB = priorityWeight[b.priority] || 2;
    return pB - pA;
  });

  let currentPoint = warehouseMap[sortedByPriority[0].source] || { lat: 0, lng: 0 };
  const optimizedRoute = [];
  let remainingShipments = [...sortedByPriority];

  while (remainingShipments.length > 0) {
    const highestRemainingPriority = priorityWeight[remainingShipments[0].priority] || 2;
    const candidates = remainingShipments.filter(
      s => (priorityWeight[s.priority] || 2) === highestRemainingPriority
    );
    
    let closestShipment = null;
    let shortestDistance = Infinity;

    candidates.forEach(shipment => {
      const destCoords = warehouseMap[shipment.destination];
      if (!destCoords) {
        shortestDistance = -1;
        closestShipment = shipment;
      } else {
        const distance = calculateDistance(currentPoint.lat, currentPoint.lng, destCoords.lat, destCoords.lng);
        if (distance < shortestDistance) {
          shortestDistance = distance;
          closestShipment = shipment;
        }
      }
    });

    optimizedRoute.push(closestShipment);
    if (warehouseMap[closestShipment.destination]) {
      currentPoint = warehouseMap[closestShipment.destination];
    }
    remainingShipments = remainingShipments.filter(s => s.id !== closestShipment.id);
  }
  return optimizedRoute;
};

// Smart Auto-Dispatcher
const dispatchNextShipment = async (driverId) => {
  if (!driverId) return;

  const inTransitCount = await Shipment.countDocuments({ driverId, status: 'IN_TRANSIT' });
  if (inTransitCount > 0) return; // Driver is busy on an active route

  const queuedShipments = await populateShipment(Shipment.find({ driverId, status: 'QUEUED' }));
  if (!queuedShipments || queuedShipments.length === 0) return; // Nothing left in the queue

  const optimized = await getOptimizedSequence(queuedShipments);
  if (optimized.length > 0) {
    const nextShipmentId = optimized[0].id || optimized[0]._id;
    await Shipment.findByIdAndUpdate(nextShipmentId, { status: 'IN_TRANSIT' });
    await DeliveryLog.create({
      shipmentId: nextShipmentId,
      status: 'IN_TRANSIT',
      notes: 'Auto-dispatched from driver queue'
    });
  }
};

// Route Optimization Engine API Endpoint
const optimizeDriverRoute = async (req, res) => {
  try {
    const { driverId } = req.params;
    // We now optimize based on QUEUED and IN_TRANSIT (if they want to see the sequence)
    const shipments = await populateShipment(Shipment.find({ driverId, status: { $in: ['PACKED', 'QUEUED', 'IN_TRANSIT'] } }));
    
    if (!shipments.length) {
      return res.status(200).json({ message: 'No active shipments for this driver.', optimizedRoute: [] });
    }

    const optimizedRoute = await getOptimizedSequence(shipments);

    res.status(200).json({
      message: 'Route optimized successfully using Priority and Geographical Nearest-Neighbor algorithms.',
      optimizedRoute
    });
  } catch (error) {
    res.status(500).json({ message: 'Error optimizing route', error: error.message });
  }
};

module.exports = {
  getAllShipments,
  getShipmentById,
  createShipment,
  updateShipmentStatus,
  deleteShipment,
  optimizeDriverRoute
};
