const express = require('express');
const router = express.Router();
const { generateToken } = require('../controllers/agoraController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/agora/token?channelName=xyz&uid=123
router.get('/token', protect, generateToken);

module.exports = router;
