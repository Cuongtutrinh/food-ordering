const Coupon = require('../models/Coupon');
const User = require('../models/User');

// ✅ [ADMIN] Tạo mã giảm giá
exports.createCoupon = async (req, res) => {
  try {
    const { code, discountAmount, description, minOrderAmount, expiresAt, maxUsage, allowedUserIds } = req.body;

    if (!code || !discountAmount) {
      return res.status(400).json({ success: false, message: 'Code và discount amount là bắt buộc' });
    }

    // ✅ Kiểm tra trùng code (case-sensitive)
    const existing = await Coupon.findOne({ code: code });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã tồn tại' });
    }

    const coupon = await Coupon.create({
      code: code, // ✅ Giữ nguyên chữ hoa/thường
      discountAmount,
      description: description || '',
      minOrderAmount: minOrderAmount || 0,
      expiresAt: expiresAt || null,
      maxUsage: maxUsage || null,
      allowedUsers: allowedUserIds || [],
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, coupon });
  } catch (error) {
    console.error('[createCoupon] error:', error);
    res.status(500).json({ success: false, message: 'Lỗi tạo mã giảm giá' });
  }
};

// ✅ [ADMIN] Lấy tất cả mã giảm giá
exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find()
      .populate('allowedUsers', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, coupons });
  } catch (error) {
    console.error('[getAllCoupons] error:', error);
    res.status(500).json({ success: false, message: 'Lỗi lấy danh sách mã giảm giá' });
  }
};

// ✅ [ADMIN] Lấy 1 mã giảm giá
exports.getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
      .populate('allowedUsers', 'name email')
      .populate('createdBy', 'name email');

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá' });
    }

    res.json({ success: true, coupon });
  } catch (error) {
    console.error('[getCouponById] error:', error);
    res.status(500).json({ success: false, message: 'Lỗi lấy thông tin mã giảm giá' });
  }
};

// ✅ [ADMIN] Cập nhật mã giảm giá
exports.updateCoupon = async (req, res) => {
  try {
    const { code, discountAmount, description, minOrderAmount, expiresAt, maxUsage, isActive, allowedUserIds } = req.body;

    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá' });
    }

    // ✅ Nếu đổi code, kiểm tra trùng
    if (code && code !== coupon.code) {
      const existing = await Coupon.findOne({ code: code });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Mã code đã tồn tại' });
      }
      coupon.code = code;
    }

    if (discountAmount !== undefined) coupon.discountAmount = discountAmount;
    if (description !== undefined) coupon.description = description;
    if (minOrderAmount !== undefined) coupon.minOrderAmount = minOrderAmount;
    if (expiresAt !== undefined) coupon.expiresAt = expiresAt;
    if (maxUsage !== undefined) coupon.maxUsage = maxUsage;
    if (isActive !== undefined) coupon.isActive = isActive;
    if (allowedUserIds !== undefined) coupon.allowedUsers = allowedUserIds;

    await coupon.save();

    const updated = await Coupon.findById(coupon._id)
      .populate('allowedUsers', 'name email')
      .populate('createdBy', 'name email');

    res.json({ success: true, coupon: updated });
  } catch (error) {
    console.error('[updateCoupon] error:', error);
    res.status(500).json({ success: false, message: 'Lỗi cập nhật mã giảm giá' });
  }
};

// ✅ [ADMIN] Xóa mã giảm giá
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá' });
    }

    await coupon.deleteOne();
    res.json({ success: true, message: 'Đã xóa mã giảm giá' });
  } catch (error) {
    console.error('[deleteCoupon] error:', error);
    res.status(500).json({ success: false, message: 'Lỗi xóa mã giảm giá' });
  }
};

// ✅ [ADMIN] Gán mã cho users
exports.assignCouponToUsers = async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn user' });
    }

    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá' });
    }

    // Thêm users vào allowedUsers (không trùng lặp)
    const newUsers = userIds.filter(uid => !coupon.allowedUsers.includes(uid));
    coupon.allowedUsers.push(...newUsers);
    await coupon.save();

    const updated = await Coupon.findById(coupon._id).populate('allowedUsers', 'name email');
    res.json({ success: true, coupon: updated, message: 'Đã gán mã cho user' });
  } catch (error) {
    console.error('[assignCouponToUsers] error:', error);
    res.status(500).json({ success: false, message: 'Lỗi gán mã' });
  }
};

// ✅ [USER] Lấy danh sách mã của user
exports.getMyCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({
      allowedUsers: req.user._id,
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    }).select('-allowedUsers -createdBy');

    res.json({ success: true, coupons });
  } catch (error) {
    console.error('[getMyCoupons] error:', error);
    res.status(500).json({ success: false, message: 'Lỗi lấy mã giảm giá' });
  }
};

// ✅ [USER] Validate mã giảm giá khi nhập
exports.validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;

    console.log('[validateCoupon] Request:', { code, orderAmount, userId: req.user._id });

    if (!code || !code.trim()) {
      console.log('[validateCoupon] ERROR: No code provided');
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng nhập mã giảm giá' 
      });
    }

    if (!orderAmount || orderAmount <= 0) {
      console.log('[validateCoupon] ERROR: Invalid order amount');
      return res.status(400).json({ 
        success: false, 
        message: 'Số tiền đơn hàng không hợp lệ' 
      });
    }

    const coupon = await Coupon.findOne({ 
      code: { $regex: new RegExp(`^${code.trim()}$`, 'i') }
    });

    console.log('[validateCoupon] Coupon found:', coupon?._id);

    if (!coupon) {
      console.log('[validateCoupon] ERROR: Coupon not found');
      return res.status(404).json({ 
        success: false, 
        message: 'Mã giảm giá không tồn tại' 
      });
    }

    // ✅ THÊM: Log chi tiết để debug
    console.log('[validateCoupon] Coupon details:', {
      code: coupon.code,
      isActive: coupon.isActive,
      expiresAt: coupon.expiresAt,
      minOrderAmount: coupon.minOrderAmount,
      maxUsage: coupon.maxUsage,
      usedCount: coupon.usedCount,
      allowedUsers: coupon.allowedUsers?.length || 0
    });

    if (!coupon.isActive) {
      console.log('[validateCoupon] ERROR: Coupon not active');
      return res.status(400).json({ 
        success: false, 
        message: 'Mã giảm giá đã bị vô hiệu hóa' 
      });
    }

    if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
      console.log('[validateCoupon] ERROR: Coupon expired');
      return res.status(400).json({ 
        success: false, 
        message: 'Mã giảm giá đã hết hạn' 
      });
    }

    if (coupon.allowedUsers && coupon.allowedUsers.length > 0) {
      const isAllowed = coupon.allowedUsers.some(
        userId => userId.toString() === req.user._id.toString()
      );
      
      if (!isAllowed) {
        console.log('[validateCoupon] ERROR: User not allowed');
        return res.status(403).json({ 
          success: false, 
          message: 'Bạn không được phép sử dụng mã này' 
        });
      }
    }

    if (coupon.maxUsage !== null && coupon.maxUsage !== undefined && coupon.usedCount >= coupon.maxUsage) {
      console.log('[validateCoupon] ERROR: Max usage reached');
      return res.status(400).json({ 
        success: false, 
        message: 'Mã giảm giá đã hết lượt sử dụng' 
      });
    }

    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
      console.log('[validateCoupon] ERROR: Order amount too low', {
        orderAmount,
        minOrderAmount: coupon.minOrderAmount
      });
      return res.status(400).json({
        success: false,
        message: `Đơn hàng tối thiểu ${coupon.minOrderAmount.toLocaleString('vi-VN')}₫ để sử dụng mã này`
      });
    }

    console.log('[validateCoupon] Valid! Discount:', coupon.discountAmount);

    res.json({
      success: true,
      message: 'Mã hợp lệ',
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        discountAmount: coupon.discountAmount,
        description: coupon.description,
        minOrderAmount: coupon.minOrderAmount || 0
      }
    });

  } catch (error) {
    console.error('[validateCoupon] error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi kiểm tra mã giảm giá' 
    });
  }
};