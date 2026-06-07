const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true // ✅ Giữ nguyên chữ hoa/thường
    // ✅ Lưu chính xác chữ hoa/thường
  },
  discountAmount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // ✅ User được phép sử dụng mã này
  allowedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // ✅ Số lần sử dụng tối đa (tùy chọn)
  maxUsage: {
    type: Number,
    default: null // null = không giới hạn
  },
  // ✅ Số lần đã sử dụng
  usedCount: {
    type: Number,
    default: 0
  },
  // ✅ Ngày hết hạn (tùy chọn)
  expiresAt: {
    type: Date,
    default: null
  },
  // ✅ Điều kiện đơn hàng tối thiểu
  minOrderAmount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index cho performance
couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1 });
couponSchema.index({ allowedUsers: 1 });

module.exports = mongoose.model('Coupon', couponSchema);