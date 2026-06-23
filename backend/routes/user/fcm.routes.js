const express = require('express');
const router = express.Router();
const fcmController = require('../../controllers/user/fcmController');
const { protect } = require('../../middleware/authMiddleware');

router.post('/register', protect, fcmController.registerToken);
router.post('/unregister', protect, fcmController.unregisterToken);

module.exports = router;
