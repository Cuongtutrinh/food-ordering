const mongoose = require('mongoose');

const vietQRTransactionSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    toppings: [{
      _id: { type: mongoose.Schema.Types.ObjectId },
      name: String,
      price: { type: Number, required: true, min: 0 },
      quantity: { type: Number, default: 1, min: 1 }
    }]
  }],
  shippingAddress: { type: String, required: true, trim: true },
  shippingAddressDetails: {
    addressId: mongoose.Schema.Types.ObjectId,
    label: String,
    address: String
  },
  phone: { type: String, required: true, trim: true },
  phoneDetails: {
    phoneId: mongoose.Schema.Types.ObjectId,
    label: String,
    phone: String
  },
  totalAmount: { type: Number, required: true, min: 0 },
  qrCode: { type: String, required: true },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['PENDING', 'PAID', 'EXPIRED', 'CANCELLED'],
    default: 'PENDING'
  },
  expiredAt: { type: Date, required: true },
  paidAt: { type: Date },
  bankInfo: { type: Object },
  referenceCode: { type: String, index: true },
  signature: { type: String, index: true },
  // ✅ THÊM: Lưu thông tin coupon đã áp dụng
  coupon: {
    _id: mongoose.Schema.Types.ObjectId,
    code: String,
    discountAmount: Number
  },
  meta: { type: Object }
}, { timestamps: true });

vietQRTransactionSchema.index({ user: 1, status: 1, expiredAt: -1 });
vietQRTransactionSchema.index({ signature: 1, status: 1 });
vietQRTransactionSchema.index({ user: 1, signature: 1, status: 1 });

module.exports = mongoose.model('VietQRTransaction', vietQRTransactionSchema);