const express = require('express');
const { getDashboardStats } = require('../controllers/analyticsController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/dashboard', authenticateToken, getDashboardStats);

module.exports = router;
