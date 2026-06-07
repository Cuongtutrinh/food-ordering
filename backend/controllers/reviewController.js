const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

// ✅ Tạo đánh giá mới
exports.createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    // Kiểm tra đơn hàng đã giao
    const order = await Order.findOne({
      user: req.user._id,
      'items.product': productId,
      orderStatus: 'delivered'
    });

    if (!order) {
      return res.status(403).json({
        success: false,
        message: 'Bạn chỉ có thể đánh giá sản phẩm sau khi đã nhận hàng'
      });
    }

    // Kiểm tra đã đánh giá chưa
    const existingReview = await Review.findOne({
      user: req.user._id,
      product: productId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đánh giá sản phẩm này rồi',
        review: existingReview // ✅ Trả về review cũ
      });
    }

    const review = new Review({
      user: req.user._id,
      product: productId,
      rating,
      comment
    });

    await review.save();

    // Cập nhật sản phẩm
    const product = await Product.findById(productId);
    product.reviews.push(review._id);
    await product.save();

    // ✅ Populate user info trước khi trả về
    const populatedReview = await Review.findById(review._id)
      .populate('user', 'name');

    res.status(201).json({
      success: true,
      message: 'Đánh giá đã được gửi thành công',
      review: populatedReview
    });

  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo đánh giá'
    });
  }
};

// ✅ Lấy danh sách đánh giá của sản phẩm
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ product: productId })
      .populate('user', 'name')
      .sort('-createdAt');
    
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error });
  }
};

// ✅ THÊM: Kiểm tra user có thể đánh giá không
exports.canReview = async (req, res) => {
  try {
    const { productId } = req.params;

    // Kiểm tra đơn hàng đã giao
    const order = await Order.findOne({
      user: req.user._id,
      'items.product': productId,
      orderStatus: 'delivered'
    });

    if (!order) {
      return res.json({
        success: false,
        canReview: false,
        message: 'Bạn chưa mua sản phẩm này hoặc đơn hàng chưa được giao'
      });
    }

    // Kiểm tra đã đánh giá chưa
    const existingReview = await Review.findOne({
      user: req.user._id,
      product: productId
    }).populate('user', 'name');

    if (existingReview) {
      return res.json({
        success: true,
        canReview: false,
        hasReviewed: true,
        review: existingReview,
        message: 'Bạn đã đánh giá sản phẩm này rồi'
      });
    }

    res.json({
      success: true,
      canReview: true,
      message: 'Bạn có thể đánh giá sản phẩm này'
    });

  } catch (error) {
    console.error('[canReview] error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi kiểm tra quyền đánh giá'
    });
  }
};

// ✅ THÊM: Lấy đánh giá của user cho sản phẩm
exports.getUserReview = async (req, res) => {
  try {
    const { productId } = req.params;

    const review = await Review.findOne({
      user: req.user._id,
      product: productId
    }).populate('user', 'name');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Chưa có đánh giá'
      });
    }

    res.json({
      success: true,
      review
    });

  } catch (error) {
    console.error('[getUserReview] error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy đánh giá'
    });
  }
};