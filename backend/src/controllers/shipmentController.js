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
    status: { $in: ['PACKED', 'IN_TRANSIT'] }
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

    let finalWarehouseId = warehouseId || null;

    if (!finalWarehouseId) {
      // SMART ALLOCATION: Auto-assign to the warehouse with the most available capacity %
      const warehouses = await Warehouse.find();
      let bestWarehouse = null;
      let highestAvailability = -1;

      for (const w of warehouses) {
        if (w.currentUsage + shipmentWeight <= w.capacity) {
          const availability = 1 - (w.currentUsage + shipmentWeight) / w.capacity;
          if (availability > highestAvailability) {
            highestAvailability = availability;
            bestWarehouse = w;
          }
        }
      }

      if (bestWarehouse) {
        finalWarehouseId = bestWarehouse._id;
      }
    } else {
      const warehouse = await Warehouse.findById(finalWarehouseId);
      if (!warehouse) throw new Error('Selected warehouse was not found.');
      if (warehouse.currentUsage + shipmentWeight > warehouse.capacity) {
        throw new Error('Selected warehouse does not have enough available capacity.');
      }
    }

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
      status: driverId ? 'IN_TRANSIT' : 'PENDING',
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
        // Left the warehouse, free up capacity
        await Warehouse.findByIdAndUpdate(existing.warehouseId, { $inc: { currentUsage: -existing.weight } });
      } else if (wasOutside && isInside) {
        // Returned to warehouse, consume capacity
        await Warehouse.findByIdAndUpdate(existing.warehouseId, { $inc: { currentUsage: existing.weight } });
      }
    }

    await DeliveryLog.create({
      shipmentId: updatedShipment.id,
      status,
      notes: notes || `Status updated to ${status}`
    });

    if (driverId && status !== 'DELIVERED') {
      await Driver.findByIdAndUpdate(driverId, { status: 'ON_DELIVERY' });
    }

    if (status === 'DELIVERED') {
      await releaseDriverIfIdle(updatedShipment.driverId, id);
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

// Route Optimization Engine: Calculate the best delivery sequence for a driver
const optimizeDriverRoute = async (req, res) => {
  try {
    const { driverId } = req.params;
    const shipments = await populateShipment(Shipment.find({ driverId, status: { $in: ['PACKED', 'IN_TRANSIT'] } }));
    
    if (!shipments.length) {
      return res.status(200).json({ message: 'No active shipments for this driver.', optimizedRoute: [] });
    }

    // Optimization Heuristic 1: Priority ('High' > 'Normal' > 'Low')
    // Optimization Heuristic 2: Weight (Heaviest first to reduce vehicle load quickly and save fuel)
    const priorityWeight = { 'High': 3, 'Normal': 2, 'Low': 1 };
    
    const optimizedRoute = shipments.sort((a, b) => {
      const pA = priorityWeight[a.priority] || 2;
      const pB = priorityWeight[b.priority] || 2;
      if (pA !== pB) return pB - pA; // Higher priority first
      return b.weight - a.weight; // Heaviest first
    });

    res.status(200).json({
      message: 'Route optimized successfully based on priority and load constraints.',
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
