const prisma = require('../services/prisma');

const getAllDrivers = async (req, res) => {
  try {
    const drivers = await prisma.driver.findMany();
    res.status(200).json(drivers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching drivers', error: error.message });
  }
};

const getDriverById = async (req, res) => {
  try {
    const { id } = req.params;
    const driver = await prisma.driver.findUnique({
      where: { id },
      include: { shipments: true }
    });
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    res.status(200).json(driver);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching driver', error: error.message });
  }
};

const createDriver = async (req, res) => {
  try {
    const { name, phone, vehicleNumber, status } = req.body;
    if (!name || !phone || !vehicleNumber) {
      return res.status(400).json({ message: 'Name, phone, and vehicle number are required.' });
    }

    const driver = await prisma.driver.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        vehicleNumber: vehicleNumber.trim(),
        status: status || 'AVAILABLE'
      }
    });
    res.status(201).json(driver);
  } catch (error) {
    res.status(400).json({ message: 'Error creating driver', error: error.message });
  }
};

const updateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, vehicleNumber, status } = req.body;
    const driver = await prisma.driver.update({
      where: { id },
      data: { name, phone, vehicleNumber, status }
    });
    res.status(200).json(driver);
  } catch (error) {
    res.status(500).json({ message: 'Error updating driver', error: error.message });
  }
};

const deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.driver.delete({ where: { id } });
    res.status(200).json({ message: 'Driver deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting driver', error: error.message });
  }
};

module.exports = {
  getAllDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver
};
