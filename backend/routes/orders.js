const express = require('express');
const { protect, admin } = require('../middleware/auth'); // ĐẢM BẢO CÓ admin
const {
  createOrder,
  getUserOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getOrderStats,
  canReviewProduct,
  confirmQRPayment,
  adminConfirmQRPayment,
  adminCancelQRPayment,
  getPendingQRPayments,
  getOrderQRCode,
  cancelOrder
} = require('../controllers/orderController');
const router = express.Router();

router.route('/')
  .post(protect, createOrder)
  .get(protect, admin, getAllOrders);

router.route('/my-orders')
  .get(protect, getUserOrders);

router.route('/stats')
  .get(protect, admin, getOrderStats);

router.route('/:id')
  .get(protect, admin, getOrderById);

router.route('/:id/status')
  .put(protect, admin, updateOrderStatus);

// QR Code Payment Routes
router.route('/qr-payment/:orderId/confirm')
  .post(protect, confirmQRPayment);

router.route('/qr-payment/:orderId/admin-confirm')
  .post(protect, admin, adminConfirmQRPayment);

router.route('/qr-payment/:orderId/admin-cancel')
  .post(protect, admin, adminCancelQRPayment);

router.route('/:id/cancel')
  .post(protect, cancelOrder);

router.route('/qr-payment/pending')
  .get(protect, admin, getPendingQRPayments);

router.route('/qr-code/:orderId')
  .get(protect, getOrderQRCode);

router.route('/can-review/:productId')
  .get(protect, canReviewProduct);


module.exports = router;