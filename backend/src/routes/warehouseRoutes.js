const express = require('express');
const {
  getAllWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse
} = require('../controllers/warehouseController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticateToken, getAllWarehouses);
router.get('/:id', authenticateToken, getWarehouseById);
router.post('/', authenticateToken, authorizeRole(['ADMIN', 'MANAGER']), createWarehouse);
router.put('/:id', authenticateToken, authorizeRole(['ADMIN', 'MANAGER']), updateWarehouse);
router.delete('/:id', authenticateToken, authorizeRole(['ADMIN', 'MANAGER']), deleteWarehouse);

module.exports = router;
