const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticateToken } = require('../middleware/authMiddleware');

// We protect the AI route with authentication
router.post('/chat', authenticateToken, aiController.chatWithAI);

module.exports = router;
