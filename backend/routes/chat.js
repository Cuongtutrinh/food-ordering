const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');

// Route gửi tin nhắn - không yêu cầu đăng nhập
router.post('/send', chatController.handleUserMessage);

// Route lấy lịch sử chat
router.get('/history/:sessionId', chatController.getChatHistory);

// Route lấy gợi ý chat
router.get('/suggestions', chatController.getChatSuggestions);

// Route làm mới cache menu (admin only)
router.post('/refresh-menu-cache', auth.protect, auth.admin, chatController.refreshMenuCache);

module.exports = router;