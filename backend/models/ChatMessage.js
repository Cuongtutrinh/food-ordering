const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null  // Cho phép người dùng ẩn danh
  },
  sessionId: {
    type: String,
    required: true,  // ID phiên chat
    index: true      // Index để tăng tốc truy vấn
  },
  sender: {
    type: String,
    enum: ['user', 'bot'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Tạo compound index
chatMessageSchema.index({ sessionId: 1, timestamp: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);