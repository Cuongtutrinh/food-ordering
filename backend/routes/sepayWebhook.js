const express = require('express');
const router = express.Router();
const sepayWebhookController = require('../controllers/sepayWebhookController');

// Route xử lý webhook từ Sepay
router.post('/webhook', sepayWebhookController.handleWebhook);

module.exports = router;