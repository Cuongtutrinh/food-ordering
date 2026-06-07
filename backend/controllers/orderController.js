const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Review = require('../models/Review');
const emailService = require('../utils/emailService');
const vietQRService = require('../utils/vietQRService');
const crypto = require('crypto');
const Coupon = require('../models/Coupon');

exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, phone, paymentMethod = 'cod', notes, selectedAddressId,
      selectedPhoneId, couponCode  } = req.body;

    console.log('Received order data:', { items, shippingAddress, phone, paymentMethod, notes, selectedAddressId,
      selectedPhoneId, couponCode });

    if (paymentMethod === 'qrcode') {
      return res.status(400).json({
        success: false,
        message: 'Phương thức thanh toán VietQR phải dùng endpoint /api/vietqr/intent'
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Giỏ hàng trống'
      });
    }

    if (!shippingAddress || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin địa chỉ hoặc số điện thoại'
      });
    }

    const user = await User.findById(req.user._id);
    let addressDetails = null;
    let phoneDetails = null;

    // Tìm thông tin chi tiết của address đã chọn
    if (selectedAddressId && user.addresses) {
      const selectedAddress = user.addresses.id(selectedAddressId);
      if (selectedAddress) {
        addressDetails = {
          addressId: selectedAddressId,
          label: selectedAddress.label,
          address: selectedAddress.address
        };
      }
    }

    // Tìm thông tin chi tiết của phone đã chọn
    if (selectedPhoneId && user.phones) {
      const selectedPhone = user.phones.id(selectedPhoneId);
      if (selectedPhone) {
        phoneDetails = {
          phoneId: selectedPhoneId,
          label: selectedPhone.label,
          phone: selectedPhone.phone
        };
      }
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm với ID ${item.product} không tồn tại`
        });
      }

      // Tính giá sản phẩm
      const basePrice = product.price * item.quantity;
      totalAmount += basePrice;

      //  Xử lý toppings với cấu trúc đúng
      const processedToppings = [];
      let toppingsPrice = 0;

      if (item.toppings && item.toppings.length > 0) {
        for (const topping of item.toppings) {
          const processedTopping = {
            _id: topping._id || null, // Có thể null nếu không có ID
            name: topping.name || '',
            price: topping.price || 0,
            quantity: topping.quantity || 1
          };
          
          const toppingTotalPrice = processedTopping.price * processedTopping.quantity * item.quantity;
          toppingsPrice += toppingTotalPrice;
          
          processedToppings.push(processedTopping);
          
          console.log(`Processing topping: ${processedTopping.name}, price: ${processedTopping.price}, quantity: ${processedTopping.quantity}, total: ${toppingTotalPrice}`);
        }
      }

      totalAmount += toppingsPrice;

      const orderItem = {
        product: item.product,
        quantity: item.quantity,
        price: product.price,
        toppings: processedToppings
      };

      orderItems.push(orderItem);
      
      console.log(`Order item processed:`, {
        productName: product.name,
        quantity: item.quantity,
        basePrice,
        toppingsCount: processedToppings.length,
        toppingsPrice,
        itemTotal: basePrice + toppingsPrice
      });
    }

    const subtotal = totalAmount;

    // Phí giao hàng
    const shippingFee = subtotal >= 300000 ? 0 : 15000;
    totalAmount += shippingFee;

    console.log('Final order total:', totalAmount);

    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode && couponCode.trim()) {
      console.log('[createOrder] Validating coupon:', couponCode);
      
      const coupon = await Coupon.findOne({ 
        code: { $regex: new RegExp(`^${couponCode.trim()}$`, 'i') }
      });

      if (!coupon) {
        return res.status(404).json({ 
          success: false, 
          message: 'Mã giảm giá không tồn tại' 
        });
      }

      console.log('[createOrder] Coupon found:', {
        code: coupon.code,
        discount: coupon.discountAmount,
        minOrder: coupon.minOrderAmount,
        isActive: coupon.isActive,
        usedCount: coupon.usedCount,
        maxUsage: coupon.maxUsage
      });

      if (!coupon.isActive) {
        return res.status(400).json({ 
          success: false, 
          message: 'Mã giảm giá đã bị vô hiệu hóa' 
        });
      }

      if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Mã giảm giá đã hết hạn' 
        });
      }
      
      // Validate user được phép sử dụng
      if (coupon.allowedUsers && coupon.allowedUsers.length > 0) {
        const isAllowed = coupon.allowedUsers.some(
          uid => uid.toString() === req.user._id.toString()
        );
        if (!isAllowed) {
          return res.status(403).json({ 
            success: false, 
            message: 'Bạn không được phép sử dụng mã này' 
          });
        }
      }
      
      // Validate số lần sử dụng
      if (coupon.maxUsage !== null && coupon.maxUsage !== undefined && coupon.usedCount >= coupon.maxUsage) {
        return res.status(400).json({ 
          success: false, 
          message: 'Mã giảm giá đã hết lượt sử dụng' 
        });
      }
      
      // Validate đơn hàng tối thiểu (dùng subtotal, không tính shipping)
      if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
        return res.status(400).json({
          success: false,
          message: `Đơn hàng tối thiểu ${coupon.minOrderAmount.toLocaleString('vi-VN')}₫ để sử dụng mã này`
        });
      }
      
      // Áp dụng giảm giá
      discountAmount = coupon.discountAmount;
      const totalAfterDiscount = Math.max(0, subtotal - discountAmount);
      totalAmount = totalAfterDiscount + shippingFee;

      appliedCoupon = {
        _id: coupon._id,
        code: coupon.code,
        discountAmount: coupon.discountAmount
      };
      
      console.log('[createOrder] Coupon applied:', {
        code: coupon.code,
        discountAmount,
        subtotal,
        totalAfterDiscount,
        shippingFee,
        finalTotal: totalAmount
      });

      //  Tăng số lần sử dụng NGAY LẬP TỨC (cho COD)
      await Coupon.findByIdAndUpdate(coupon._id, {
        $inc: { usedCount: 1 }
      });
      console.log('[createOrder] Coupon usedCount incremented:', coupon.code);
    }

    console.log('Final order total:', totalAmount);

    const orderData = {
      user: req.user._id,
      items: orderItems,
      totalAmount,
      discountAmount, 
      coupon: appliedCoupon,
      shippingAddress,
      phone,
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      orderStatus: 'pending',
      notes: notes || '',
      meta: {
        subtotal,
        shippingFee,
        discountAmount
      }
    };

     // Thêm thông tin chi tiết nếu có
    if (addressDetails) {
      orderData.shippingAddressDetails = addressDetails;
    }
    
    if (phoneDetails) {
      orderData.phoneDetails = phoneDetails;
    }

    const newOrder = await Order.create(orderData);

    // Populate đơn hàng để trả về đầy đủ thông tin
    let populatedOrder = await Order.findById(newOrder._id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name image price')
      .populate('coupon', 'code discountAmount');

    console.log('Order created successfully:', populatedOrder._id);

    const io = req.app.get('io');
    if (io) {
      console.log('Sending new order notification via socket...');
      io.emit('newOrder', {
        order: populatedOrder,
        message: `Đơn hàng mới từ ${populatedOrder.user.name}`,
        type: 'newOrder'
      });
    }

    // COD
    res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công',
      order: populatedOrder
    });

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message,
      details: 'Có lỗi xảy ra khi tạo đơn hàng'
    });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const foundOrder = await Order.findById(id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name image price');
    
    if (!foundOrder) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }
    
    res.json({
      success: true,
      data: foundOrder
    });
    
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy thông tin đơn hàng'
    });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const userOrders = await Order.find({ user: req.user._id })
      .populate({
        path: 'items.product',
        select: 'name image price',
        // Thêm match để chỉ populate những product còn tồn tại
        match: { _id: { $exists: true } }
      })
      .sort({ createdAt: -1 });
    
    // ✅ Đảm bảo toppings được bao gồm trong response
    const processedOrders = userOrders.map(orderDoc => {
      const orderObj = orderDoc.toObject();
      
      // Lọc bỏ items có product null và đảm bảo toppings được giữ nguyên
      orderObj.items = orderObj.items
        .filter(item => item.product !== null)
        .map(item => ({
          ...item,
          toppings: item.toppings || [] // Đảm bảo toppings luôn là array
        }));
      
      return orderObj;
    });
    
    console.log('Fetched user orders with toppings:', processedOrders.length);
    res.json(processedOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const allOrders = await Order.find()
      .populate('user', 'name email phone')
      .populate({
        path: 'items.product',
        select: 'name image price',
        // Thêm match để chỉ populate những product còn tồn tại
        match: { _id: { $exists: true } }
      })
      .sort({ createdAt: -1 });
    
    // ✅ Đảm bảo toppings được bao gồm cho admin
    const processedOrders = allOrders.map(orderDoc => {
      const orderObj = orderDoc.toObject();
      
      orderObj.items = orderObj.items
        .filter(item => item.product !== null)
        .map(item => ({
          ...item,
          toppings: item.toppings || []
        }));
      
      return orderObj;
    });
    
    console.log('Fetched admin orders with toppings:', processedOrders.length);
    res.json(processedOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, shouldSendEmail = false } = req.body;
    
    console.log('Updating order status:', { id, orderStatus, shouldSendEmail });
    
    // ✅ Validate orderStatus trước khi update
    const validStatuses = ['pending', 'confirmed', 'preparing', 'shipping', 'delivering', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid order status: ${orderStatus}. Valid statuses are: ${validStatuses.join(', ')}`
      });
    }
    
    // ✅ FIX: Sử dụng biến updatedOrder thay vì order
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { orderStatus },
      { 
        new: true,
        runValidators: true
      }
    ).populate('user', 'name email phone')
     .populate('items.product', 'name image price');
    
    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }
    
    console.log('Order status updated successfully:', updatedOrder._id);
    
     // ✅ Gửi thông báo real-time khi cập nhật trạng thái
    const io = req.app.get('io');
    if (io) {
      console.log('Sending order status update via socket...');
      io.emit('orderStatusUpdate', {
        orderId: updatedOrder._id,
        orderStatus: updatedOrder.orderStatus,
        order: updatedOrder,
        message: `Đơn hàng #${updatedOrder._id.toString().slice(-8).toUpperCase()} đã được cập nhật thành "${orderStatus}"`,
        type: 'statusUpdate'
      });
    }

    // ✅Sử dụng updatedOrder
    // Gửi email thông báo
    if (shouldSendEmail && updatedOrder.user && updatedOrder.user.email) {
      try {
        await emailService.sendReviewReminder(
          updatedOrder.user.email,
          updatedOrder.user.name,
          updatedOrder,
          orderStatus
        );
        console.log('Email notification sent successfully');
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        // Không throw error, vì update order đã thành công
      }
    }
    
    res.json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công',
      data: updatedOrder
    });
    
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi cập nhật trạng thái đơn hàng'
    });
  }
};

exports.canReviewProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    const order = await Order.findOne({
      user: userId,
      'items.product': productId,
      orderStatus: 'delivered'
    });

    const hasReviewed = await Review.findOne({
      user: userId,
      product: productId
    });

    res.json({
      canReview: !!order && !hasReviewed
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrderStats = async (req, res) => {
  try {
    // Tính tổng doanh thu từ các đơn hàng đã giao
    const stats = await Order.aggregate([
      {
        $match: {
          orderStatus: 'delivered'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
          totalItems: { 
            $sum: { 
              $reduce: {
                input: '$items',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.quantity'] }
              }
            }
          }
        }
      }
    ]);

    // Thống kê doanh thu theo ngày (30 ngày gần nhất)
    const dailyStats = await Order.aggregate([
      {
        $match: {
          orderStatus: 'delivered',
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalRevenue: stats[0]?.totalRevenue || 0,
      totalOrders: stats[0]?.totalOrders || 0,
      totalItems: stats[0]?.totalItems || 0,
      dailyStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// QR Code Payment Endpoints

exports.confirmQRPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

  // Khi user xác nhận đã thanh toán, cập nhật trạng thái sang 'waiting_confirmation'
  const result = await qrCodeService.confirmQRPayment(orderId, userId);
  res.json(result);
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

exports.adminConfirmQRPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const adminId = req.user._id;

    const result = await qrCodeService.adminConfirmQRPayment(orderId, adminId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

exports.adminCancelQRPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { cancelReason } = req.body;
    const adminId = req.user._id;

    const result = await qrCodeService.adminCancelQRPayment(orderId, adminId, cancelReason);
    res.json(result);
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

exports.getPendingQRPayments = async (req, res) => {
  try {
    const orders = await qrCodeService.getPendingQRPayments();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

exports.getOrderQRCode = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    const order = await Order.findById(orderId)
      .populate('user', 'name email phone')
      .populate('items.product', 'name image price');

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy đơn hàng' 
      });
    }

    if (order.user._id.toString() !== userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Không có quyền truy cập đơn hàng này' 
      });
    }

    if (order.paymentMethod !== 'qrcode') {
      return res.status(400).json({ 
        success: false, 
        message: 'Đơn hàng này không sử dụng phương thức thanh toán QR Code' 
      });
    }

    // Nếu chưa có QR Code, tạo mới
    if (!order.qrCode) {
      const qrResult = await qrCodeService.generateOrderQRCode(order);
      
      await Order.findByIdAndUpdate(orderId, {
        qrCode: qrResult.qrCode
      });

      res.json({
        success: true,
        qrCode: qrResult.qrCode,
        qrData: qrResult.qrData,
        order: order
      });
    } else {
      res.json({
        success: true,
        qrCode: order.qrCode,
        order: order
      });
    }

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Cancel order by user
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Check if user owns this order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền hủy đơn hàng này'
      });
    }

    // Check if order can be cancelled (only pending orders)
    if (order.orderStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Không thể hủy đơn hàng ở trạng thái này'
      });
    }

    order.orderStatus = 'cancelled';
    order.paymentStatus = 'cancelled';
    await order.save();

    res.json({
      success: true,
      message: 'Đã hủy đơn hàng thành công'
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false, 
      message: 'Có lỗi xảy ra khi hủy đơn hàng'
    });
  }
};