const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
  createReview, 
  getProductReviews,
  canReview,       
  getUserReview     
} = require('../controllers/reviewController');

// Tạo đánh giá mới
router.route('/')
  .post(protect, createReview);

// Lấy danh sách đánh giá của sản phẩm
router.route('/product/:productId')
  .get(getProductReviews);

// Kiểm tra có thể review không
router.route('/can-review/:productId')
  .get(protect, canReview);

// Lấy review của user
router.route('/my-review/:productId')
  .get(protect, getUserReview);

module.exports = router;