const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const couponController = require('../controllers/couponController');

// Admin routes
router.post('/', protect, admin, couponController.createCoupon);
router.get('/', protect, admin, couponController.getAllCoupons);
router.get('/:id', protect, admin, couponController.getCouponById);
router.put('/:id', protect, admin, couponController.updateCoupon);
router.delete('/:id', protect, admin, couponController.deleteCoupon);

// ✅ Admin: Assign coupon to users
router.post('/:id/assign', protect, admin, couponController.assignCouponToUsers);

// User routes
router.get('/my/coupons', protect, couponController.getMyCoupons);
router.post('/validate', protect, couponController.validateCoupon);

module.exports = router;