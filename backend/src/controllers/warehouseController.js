const prisma = require('../services/prisma');

const getAllWarehouses = async (req, res) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: { _count: { select: { shipments: true } } }
    });
    res.status(200).json(warehouses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching warehouses', error: error.message });
  }
};

const getWarehouseById = async (req, res) => {
  try {
    const { id } = req.params;
    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: { shipments: true }
    });
    if (!warehouse) return res.status(404).json({ message: 'Warehouse not found' });
    res.status(200).json(warehouse);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching warehouse', error: error.message });
  }
};

const createWarehouse = async (req, res) => {
  try {
    const { name, locationName, lat, lng, capacity, currentUsage } = req.body;
    const latitude = Number(lat);
    const longitude = Number(lng);
    const totalCapacity = Number(capacity);
    const usage = currentUsage === undefined || currentUsage === '' ? 0 : Number(currentUsage);

    if (!name || !locationName || !Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(totalCapacity) || totalCapacity <= 0) {
      return res.status(400).json({ message: 'Name, location, coordinates, and a valid capacity are required.' });
    }

    if (!Number.isFinite(usage) || usage < 0 || usage > totalCapacity) {
      return res.status(400).json({ message: 'Current usage must be between 0 and capacity.' });
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name: name.trim(),
        locationName: locationName.trim(),
        lat: latitude,
        lng: longitude,
        capacity: Math.round(totalCapacity),
        currentUsage: Math.round(usage)
      }
    });
    res.status(201).json(warehouse);
  } catch (error) {
    res.status(400).json({ message: 'Error creating warehouse', error: error.message });
  }
};

const updateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, locationName, lat, lng, capacity } = req.body;
    const warehouse = await prisma.warehouse.update({
      where: { id },
      data: { name, locationName, lat, lng, capacity }
    });
    res.status(200).json(warehouse);
  } catch (error) {
    res.status(500).json({ message: 'Error updating warehouse', error: error.message });
  }
};

const deleteWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.warehouse.delete({ where: { id } });
    res.status(200).json({ message: 'Warehouse deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting warehouse', error: error.message });
  }
};

module.exports = {
  getAllWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse
};
