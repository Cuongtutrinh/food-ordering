const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để truy cập'
      }); }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[protect] Token verified, user ID:', decoded.id);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      console.error('[protect] ERROR: User not found in DB');
      return res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại'
      });
    }

    console.log('[protect] User authenticated:', req.user.email);
    next();

  } catch (error) {
    console.error('[protect] ERROR:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn, vui lòng đăng nhập lại'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi xác thực'
    });
  }
};

exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      success: false,
      message: 'Truy cập bị từ chối. Yêu cầu quyền admin.' 
    });
  }
};