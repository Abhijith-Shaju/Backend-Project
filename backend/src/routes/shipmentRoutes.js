const express = require('express');
const {
  getAllShipments,
  getShipmentById,
  createShipment,
  updateShipmentStatus,
  deleteShipment
} = require('../controllers/shipmentController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticateToken, getAllShipments);
router.get('/:id', authenticateToken, getShipmentById);
router.post('/', authenticateToken, authorizeRole(['ADMIN', 'MANAGER']), createShipment);
router.patch('/:id/status', authenticateToken, updateShipmentStatus);
router.delete('/:id', authenticateToken, authorizeRole(['ADMIN']), deleteShipment);

module.exports = router;
