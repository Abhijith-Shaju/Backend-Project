const Shipment = require('../models/Shipment');
const Warehouse = require('../models/Warehouse');
const Driver = require('../models/Driver');
const DeliveryLog = require('../models/DeliveryLog');

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

    if (warehouseId) {
      const warehouse = await Warehouse.findById(warehouseId);
      if (!warehouse) throw new Error('Selected warehouse was not found.');
      if (warehouse.currentUsage + shipmentWeight > warehouse.capacity) {
        throw new Error('Selected warehouse does not have enough available capacity.');
      }
    }

    if (driverId) {
      const driver = await Driver.findById(driverId);
      if (!driver) throw new Error('Selected driver was not found.');
    }

    const createdShipment = await Shipment.create({
      source: source.trim(),
      destination: destination.trim(),
      weight: shipmentWeight,
      priority: priority || 'Normal',
      warehouseId: warehouseId || null,
      driverId: driverId || null,
      status: driverId ? 'IN_TRANSIT' : 'PENDING'
    });

    await DeliveryLog.create({
      shipmentId: createdShipment.id,
      status: createdShipment.status,
      notes: 'Shipment created'
    });

    if (warehouseId) {
      await Warehouse.findByIdAndUpdate(warehouseId, { $inc: { currentUsage: shipmentWeight } });
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

    await DeliveryLog.deleteMany({ shipmentId: id });
    res.status(200).json({ message: 'Shipment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting shipment', error: error.message });
  }
};

module.exports = {
  getAllShipments,
  getShipmentById,
  createShipment,
  updateShipmentStatus,
  deleteShipment
};
