const prisma = require('../services/prisma');

const getAllShipments = async (req, res) => {
  try {
    const shipments = await prisma.shipment.findMany({
      include: { driver: true, warehouse: true }
    });
    res.status(200).json(shipments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shipments', error: error.message });
  }
};

const getShipmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: { driver: true, warehouse: true, deliveryLogs: true }
    });
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

    const shipment = await prisma.$transaction(async (tx) => {
      if (warehouseId) {
        const warehouse = await tx.warehouse.findUnique({ where: { id: warehouseId } });
        if (!warehouse) throw new Error('Selected warehouse was not found.');
        if (warehouse.currentUsage + shipmentWeight > warehouse.capacity) {
          throw new Error('Selected warehouse does not have enough available capacity.');
        }
      }

      if (driverId) {
        const driver = await tx.driver.findUnique({ where: { id: driverId } });
        if (!driver) throw new Error('Selected driver was not found.');
      }

      const createdShipment = await tx.shipment.create({
        data: {
          source: source.trim(),
          destination: destination.trim(),
          weight: shipmentWeight,
          priority: priority || 'Normal',
          warehouseId: warehouseId || null,
          driverId: driverId || null,
          status: driverId ? 'IN_TRANSIT' : 'PENDING'
        },
        include: { driver: true, warehouse: true }
      });

      await tx.deliveryLog.create({
        data: {
          shipmentId: createdShipment.id,
          status: createdShipment.status,
          notes: 'Shipment created'
        }
      });

      if (warehouseId) {
        await tx.warehouse.update({
          where: { id: warehouseId },
          data: { currentUsage: { increment: shipmentWeight } }
        });
      }

      if (driverId) {
        await tx.driver.update({
          where: { id: driverId },
          data: { status: 'ON_DELIVERY' }
        });
      }

      return createdShipment;
    });

    res.status(201).json(shipment);
  } catch (error) {
    res.status(400).json({ message: 'Error creating shipment', error: error.message });
  }
};

const updateShipmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, driverId } = req.body;

    const shipment = await prisma.$transaction(async (tx) => {
      const existing = await tx.shipment.findUnique({ where: { id } });
      if (!existing) throw new Error('Shipment not found.');

      const updateData = { status };
      if (driverId !== undefined) updateData.driverId = driverId || null;
      if (status === 'DELIVERED') updateData.deliveryDate = new Date();

      const updatedShipment = await tx.shipment.update({
        where: { id },
        data: updateData,
        include: { driver: true, warehouse: true }
      });

      await tx.deliveryLog.create({
        data: {
          shipmentId: updatedShipment.id,
          status,
          notes: notes || `Status updated to ${status}`
        }
      });

      if (existing.driverId && status === 'DELIVERED') {
        const activeShipments = await tx.shipment.count({
          where: {
            driverId: existing.driverId,
            id: { not: id },
            status: { in: ['PACKED', 'IN_TRANSIT'] }
          }
        });
        if (activeShipments === 0) {
          await tx.driver.update({
            where: { id: existing.driverId },
            data: { status: 'AVAILABLE' }
          });
        }
      }

      return updatedShipment;
    });

    res.status(200).json(shipment);
  } catch (error) {
    res.status(400).json({ message: 'Error updating shipment status', error: error.message });
  }
};

const deleteShipment = async (req, res) => {
  try {
    const { id } = req.params;
    // Transactional delete to clean up logs first
    await prisma.$transaction([
      prisma.deliveryLog.deleteMany({ where: { shipmentId: id } }),
      prisma.shipment.delete({ where: { id } })
    ]);
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
