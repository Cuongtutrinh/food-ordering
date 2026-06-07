const ChatMessage = require('../models/ChatMessage');
const chatbotService = require('../utils/chatbotService');
const menuService = require('../utils/menuService');

/**
 * Lưu tin nhắn vào database
 * @param {string} sessionId - ID phiên chat
 * @param {string} sender - Người gửi (user/bot)
 * @param {string} message - Nội dung tin nhắn
 * @param {string} userId - ID người dùng (nếu có)
 * @returns {Object} - Tin nhắn đã lưu
 */
const saveMessage = async (sessionId, sender, message, userId = null) => {
  try {
    const chatMessage = new ChatMessage({
      user: userId,
      sessionId,
      sender,
      message
    });
    
    return await chatMessage.save();
  } catch (error) {
    console.error('Lỗi khi lưu tin nhắn:', error);
    return null;
  }
};

/**
 * Xử lý tin nhắn từ người dùng (qua API)
 */
const handleUserMessage = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const userId = req.user ? req.user._id : null;

    // Lưu tin nhắn của người dùng
    await saveMessage(sessionId, 'user', message, userId);
    
    // Lấy lịch sử chat gần đây để cung cấp ngữ cảnh
    const chatHistory = await ChatMessage.find({ sessionId })
      .sort({ timestamp: -1 })
      .limit(10)
      .sort({ timestamp: 1 });
    
    // Xử lý câu trả lời
    const botResponse = await chatbotService.processMessage(message, chatHistory);
    
    // Lưu câu trả lời của bot
    const savedBotMessage = await saveMessage(sessionId, 'bot', botResponse, userId);
    
    res.status(200).json({ 
      message: savedBotMessage.message,
      timestamp: savedBotMessage.timestamp
    });
  } catch (error) {
    console.error('Lỗi khi xử lý tin nhắn:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi xử lý tin nhắn' });
  }
};

/**
 * Lấy lịch sử chat
 */
const getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Bảo mật: Kiểm tra nếu sessionId thuộc về user đã đăng nhập
    if (req.user && sessionId.includes('user_') && !sessionId.includes(`user_${req.user._id}`)) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập lịch sử chat này' });
    }
    
    const messages = await ChatMessage.find({ sessionId })
      .sort({ timestamp: 1 });
    
    res.status(200).json(messages);
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử chat:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy lịch sử chat' });
  }
};

/**
 * Lấy gợi ý chat
 */
const getChatSuggestions = (req, res) => {
  try {
    const suggestions = chatbotService.getSuggestions();
    res.status(200).json(suggestions);
  } catch (error) {
    console.error('Lỗi khi lấy gợi ý chat:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy gợi ý chat' });
  }
};

/**
 * Làm mới cache menu
 */
const refreshMenuCache = (req, res) => {
  try {
    menuService.clearMenuCache();
    res.status(200).json({ message: 'Menu cache đã được làm mới' });
  } catch (error) {
    console.error('Lỗi khi làm mới cache menu:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi làm mới cache menu' });
  }
};

module.exports = {
  handleUserMessage,
  getChatHistory,
  getChatSuggestions,
  saveMessage,  // Export để dùng trong socket.io
  refreshMenuCache
};