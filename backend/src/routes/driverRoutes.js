const express = require('express');
const {
  getAllDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver
} = require('../controllers/driverController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticateToken, getAllDrivers);
router.get('/:id', authenticateToken, getDriverById);
router.post('/', authenticateToken, authorizeRole(['ADMIN', 'MANAGER']), createDriver);
router.put('/:id', authenticateToken, authorizeRole(['ADMIN', 'MANAGER']), updateDriver);
router.delete('/:id', authenticateToken, authorizeRole(['ADMIN']), deleteDriver);

module.exports = router;
