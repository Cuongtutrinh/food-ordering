require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const http = require('http');
const socketIo = require('socket.io');
const csurf = require('csurf');
const chatRoutes = require('./routes/chat');
const { saveMessage } = require('./controllers/chatController');
const chatbotService = require('./utils/chatbotService');
const geminiService = require('./utils/geminiService');
const couponRoutes = require('./routes/coupons');
const userRoutes = require('./routes/users');

require('./utils/passport');

dotenv.config();

// Khởi tạo Gemini service
(async () => {
  try {
    await geminiService.initializeGemini();
  } catch (error) {
    console.error('Không thể khởi tạo Gemini service:', error);
  }
})();

connectDB();

const app = express();

// Import routes
const sepayWebhookRoutes = require('./routes/sepayWebhook');

// Middleware
app.use(express.json());  // for parsing application/json
app.use(express.urlencoded({ extended: true }));  // for parsing application/x-www-form-urlencoded

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Middleware để parse JSON bodies
app.use(express.json());
// Middleware để parse URL-encoded bodies (từ form HTML) - THÊM DÒNG NÀY
app.use(express.urlencoded({ extended: true }));

// Sử dụng cookie-parser TRƯỚC csurf
app.use(cookieParser());

// Thiết lập CSRF Protection
const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
});

//app.use(csrfProtection);

// Route để gửi CSRF token cho frontend
/*app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});  */

app.use(passport.initialize());

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reset-password', require('./routes/resetPassword'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/toppings', require('./routes/toppings'));
app.use('/api/vietqr', require('./routes/vietQR'));
app.use('/api/sepay', sepayWebhookRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/users', userRoutes);


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running', 
    timestamp: new Date().toISOString() 
  });
});

// Error handling middleware
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running', 
    timestamp: new Date().toISOString() 
  });
});



const PORT = process.env.PORT || 5000;

// Tạo HTTP server
const server = http.createServer(app);

// Khởi tạo Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  transports: ['websocket', 'polling']
});

// Lưu instance socket.io vào app để sử dụng trong controllers
app.set('io', io);

// Xử lý kết nối Socket.IO
io.on('connection', (socket) => {
  console.log('Người dùng kết nối:', socket.id);
  
  // Xử lý tin nhắn trực tiếp qua socket
  socket.on('user_message', async (data) => {
    try {
      const { message, sessionId, userId } = data;
      
      if (!message || !sessionId) {
        throw new Error('Thiếu thông tin tin nhắn hoặc sessionId');
      }
      
      // Lưu tin nhắn người dùng
      await saveMessage(sessionId, 'user', message, userId);
      
      // Lấy lịch sử chat gần đây
      const ChatMessage = require('./models/ChatMessage');
      const chatHistory = await ChatMessage.find({ sessionId })
        .sort({ timestamp: -1 })
        .limit(10)
        .sort({ timestamp: 1 });
      
      // Xử lý phản hồi của bot với thêm try/catch
      let botResponse;
      try {
        botResponse = await chatbotService.processMessage(message, chatHistory);
      } catch (processError) {
        console.error('Lỗi khi xử lý tin nhắn:', processError);
        botResponse = 'Xin lỗi, tôi đang gặp sự cố khi xử lý tin nhắn của bạn.';
      }
      
      // Lưu tin nhắn bot
      const savedBotMessage = await saveMessage(sessionId, 'bot', botResponse, userId);
      
      // Gửi phản hồi về client
      socket.emit('bot_message', {
        message: savedBotMessage.message,
        timestamp: savedBotMessage.timestamp
      });
      
    } catch (error) {
      console.error('Lỗi xử lý tin nhắn socket:', error);
      socket.emit('error', { message: `Đã xảy ra lỗi khi xử lý tin nhắn: ${error.message}` });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Người dùng ngắt kết nối:', socket.id);
  });
});

// Khởi động server với socket.io
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/api/health`);
});
