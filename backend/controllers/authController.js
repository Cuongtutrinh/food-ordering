const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');
const emailService = require('../utils/emailService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Kiểm tra user đã tồn tại
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }

    // Tạo user mới
    const user = await User.create({
      name,
      email,
      password
    });

    // Tạo token
    const token = generateToken(user._id);

    // Loại bỏ password khi trả về
    const userResponse = await User.findById(user._id).select('-password');

    res.status(201).json({
      success: true,
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi đăng ký'
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt for email:', email);

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu'
      });
    }

    // Tìm user và include password để so sánh
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    console.log('User found:', user.email);

    // Kiểm tra password
    const isPasswordCorrect = await user.comparePassword(password);
    
    if (!isPasswordCorrect) {
      console.log('Password incorrect for user:', email);
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    console.log('Password correct, proceeding with login');

    // Migrate old data if needed (wrapped in try-catch)
    try {
      const hasChanges = user.migrateOldData();
      if (hasChanges) {
        await user.save();
        console.log('User data migrated successfully');
      }
    } catch (migrationError) {
      console.error('Migration error (non-critical):', migrationError);
      // Không throw error, migration là optional
    }

    // Tạo token
    const token = generateToken(user._id);

    // Lấy user data without password
    const userResponse = await User.findById(user._id).select('-password');

    console.log('Login successful for user:', userResponse.email);

    res.json({
      success: true,
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi đăng nhập'
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản với email này'
      });
    }

    // Tạo reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    await user.save();

    // Gửi email
    try {
      await emailService.sendPasswordResetEmail(user.email, resetToken);
      
      res.json({
        success: true,
        message: 'Email đặt lại mật khẩu đã được gửi'
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      return res.status(500).json({
        success: false,
        message: 'Không thể gửi email. Vui lòng thử lại sau.'
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn'
      });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();

    res.json({
      success: true,
      message: 'Mật khẩu đã được đặt lại thành công'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

exports.oauthCallback = async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
    }

    // Migrate data if needed
    try {
      const hasChanges = user.migrateOldData();
      if (hasChanges) {
        await user.save();
      }
    } catch (migrationError) {
      console.error('OAuth migration error (non-critical):', migrationError);
    }

    const token = generateToken(user._id);
    
    // Redirect với token
    res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${token}`);
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_error`);
  }
};

exports.changePassword = async (req, res) => {
  try {
    console.log('[changePassword] Request received');
    console.log('[changePassword] Body:', { 
      hasCurrentPassword: !!req.body.currentPassword,
      hasNewPassword: !!req.body.newPassword 
    });

    const { currentPassword, newPassword } = req.body;

    //  Kiểm tra req.user từ middleware
    if (!req.user || !req.user._id) {
      console.error('[changePassword] ERROR: req.user not found');
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để thực hiện thao tác này'
      });
    }  

    const userId = req.user._id;     

    if (!userId) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy User ID.' });
    }

    console.log('[changePassword] User ID:', userId);
    console.log('[changePassword] User email:', req.user.email);

    //  Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
      });
    }

    // Tìm user và SELECT password
    const user = await User.findById(userId).select('+password');

    if (!user) {
      console.error('[changePassword] ERROR: User not found in DB:', userId);
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    console.log('[changePassword] User loaded with password');
    console.log('[changePassword] Password hash:', user.password?.substring(0, 20) + '...');

    // Kiểm tra mật khẩu hiện tại
    console.log('[changePassword] Checking current password...');
    console.log('[changePassword] Current password input:', currentPassword);
    
    const isPasswordMatch = await user.comparePassword(currentPassword);

    if (!isPasswordMatch) {
      console.log('[changePassword] ERROR: Current password incorrect');
      // Trả về 400 thay vì 401
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại không đúng'
      });
    }

    console.log('[changePassword] ✅ Current password verified');

    // Cập nhật mật khẩu mới
    console.log('[changePassword] Updating password to:', newPassword);
    user.password = newPassword;
    await user.save();

    console.log('[changePassword] ✅ Password changed successfully for user:', user.email);

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });

  } catch (error) {
    console.error('[changePassword] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đổi mật khẩu',
      error: error.message
    });
  }
};