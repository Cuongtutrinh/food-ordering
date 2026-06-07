const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  toppings: [{
    _id: { type: mongoose.Schema.Types.ObjectId },
    name: { type: String },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, default: 1, min: 1 }
  }]
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true, min: 0 },

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

  orderStatus: {
    type: String,
    enum: ['pending_payment', 'pending', 'confirmed', 'preparing', 'shipping', 'delivering', 'delivered', 'canceled', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'qrcode'], // removed 'points' to prevent unsupported payment creation
    default: 'cod'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'canceled', 'cancelled'],
    default: 'pending'
  },

  coupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
    default: null
  },
  discountAmount: {
    type: Number,
    default: 0
  },

  qrCode: { type: String },
  notes: { type: String, trim: true },

  vietQRTransaction: { type: mongoose.Schema.Types.ObjectId, ref: 'VietQRTransaction' },
  meta: {
    paymentConfirmedAt: { type: Date },
    qrIntentCreatedAt: { type: Date }
  },
  signature: { type: String, index: true }
}, { timestamps: true });

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ user: 1, paymentMethod: 1, orderStatus: 1 });
orderSchema.index({ user: 1, signature: 1, paymentMethod: 1, orderStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);