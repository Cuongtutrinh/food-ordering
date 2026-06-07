const express = require('express');
const { protect } = require('../middleware/auth');
const vietQRController = require('../controllers/vietQRController');

const router = express.Router();

// Intent-based VietQR endpoints
router.post('/intent', protect, vietQRController.createIntent);
router.get('/check-status/:intentId', protect, vietQRController.checkIntentStatus);
router.post('/intent/:intentId/cancel', protect, vietQRController.cancelIntent);

module.exports = router;