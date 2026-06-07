const Order = require('../models/Order');
const VietQRTransaction = require('../models/VietQRTransaction');
const Coupon = require('../models/Coupon');
const vietQRService = require('../utils/vietQRService');
const crypto = require('crypto');

function buildSignature({ items, shippingAddress, phone }) {
  const normalized = items.map(i => ({
    product: String(i.product),
    quantity: i.quantity,
    toppings: (i.toppings || []).map(t => ({
      name: t.name || '',
      price: t.price || 0,
      quantity: t.quantity || 1
    })).sort((a,b) => a.name.localeCompare(b.name))
  })).sort((a,b) => a.product.localeCompare(b.product));
  return crypto.createHash('sha256').update(JSON.stringify({ items: normalized, shippingAddress, phone })).digest('hex');
}

// POST /api/vietqr/intent
exports.createIntent = async (req, res) => {
  try {
    const { items, shippingAddress, phone, notes, selectedAddressId, selectedPhoneId, couponCode } = req.body;
    
    console.log('[createIntent] Request:', {
      itemsCount: items?.length,
      couponCode,
      userId: req.user._id
    });

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Giỏ hàng trống' });
    }
    if (!shippingAddress || !phone) {
      return res.status(400).json({ success: false, message: 'Thiếu địa chỉ hoặc số điện thoại' });
    }

    // ✅ Build snapshot + tính subtotal (chưa shipping, chưa discount)
    let subtotal = 0;
    const snapshotItems = [];
    
    for (const item of items) {
      const product = await require('../models/Product').findById(item.product);
      if (!product) {
        return res.status(400).json({ 
          success: false, 
          message: `Sản phẩm ${item.product} không tồn tại` 
        });
      }
      
      const basePrice = product.price * item.quantity;
      subtotal += basePrice;
      
      const processedToppings = [];
      let toppingsPrice = 0;
      
      if (item.toppings && item.toppings.length) {
        for (const topping of item.toppings) {
          const processed = {
            _id: topping._id || null,
            name: topping.name || '',
            price: topping.price || 0,
            quantity: topping.quantity || 1
          };
          const toppingTotal = processed.price * processed.quantity * item.quantity;
          toppingsPrice += toppingTotal;
          processedToppings.push(processed);
        }
      }
      
      subtotal += toppingsPrice;
      
      snapshotItems.push({
        product: item.product,
        quantity: item.quantity,
        price: product.price,
        toppings: processedToppings
      });
    }

    const shippingFee = subtotal >= 300000 ? 0 : 15000;
    
    // ✅ Validate và áp dụng coupon
    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode && couponCode.trim()) {
      console.log('[createIntent] Validating coupon:', couponCode);
      
      const coupon = await Coupon.findOne({ 
        code: { $regex: new RegExp(`^${couponCode.trim()}$`, 'i') }
      });

      if (!coupon) {
        console.log('[createIntent] Coupon not found:', couponCode);
        return res.status(404).json({ 
          success: false, 
          message: 'Mã giảm giá không tồn tại' 
        });
      }

      console.log('[createIntent] Coupon found:', {
        code: coupon.code,
        discount: coupon.discountAmount,
        minOrder: coupon.minOrderAmount,
        isActive: coupon.isActive,
        usedCount: coupon.usedCount,
        maxUsage: coupon.maxUsage
      });

      // Kiểm tra các điều kiện
      if (!coupon.isActive) {
        return res.status(400).json({ 
          success: false, 
          message: 'Mã giảm giá không khả dụng' 
        });
      }

      if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Mã giảm giá đã hết hạn' 
        });
      }

      if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
        return res.status(400).json({
          success: false,
          message: `Đơn hàng tối thiểu ${coupon.minOrderAmount.toLocaleString('vi-VN')}₫ để sử dụng mã này`
        });
      }

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

      if (coupon.maxUsage !== null && coupon.maxUsage !== undefined && coupon.usedCount >= coupon.maxUsage) {
        return res.status(400).json({ 
          success: false, 
          message: 'Mã giảm giá đã hết lượt sử dụng' 
        });
      }

      // ✅ Áp dụng discount
      discountAmount = coupon.discountAmount;
      appliedCoupon = {
        _id: coupon._id,
        code: coupon.code,
        discountAmount: coupon.discountAmount
      };

      console.log('[createIntent] Coupon applied! Discount:', discountAmount);
    }

    // ✅ Tính total FINAL (subtotal - discount + shipping)
    const totalAfterDiscount = Math.max(0, subtotal - discountAmount);
    const totalAmount = totalAfterDiscount + shippingFee;

    console.log('[createIntent] Order calculation:', {
      subtotal,
      discountAmount,
      totalAfterDiscount,
      shippingFee,
      totalAmount
    });

    const signature = buildSignature({ items, shippingAddress, phone });

    // ✅ Reuse existing pending intent (KHÔNG tính coupon vào signature để tránh tạo mới khi đổi coupon)
    const now = new Date();
    let transaction = await VietQRTransaction.findOne({
      user: req.user._id,
      signature,
      status: 'PENDING',
      expiredAt: { $gt: now }
    }).sort({ createdAt: -1 });

    if (transaction) {
      console.log('[createIntent] Reusing existing transaction:', transaction._id);
      // ✅ Cập nhật coupon nếu thay đổi
      if (appliedCoupon) {
        transaction.coupon = appliedCoupon;
        transaction.totalAmount = totalAmount;
        transaction.amount = totalAmount;
        await transaction.save();
        console.log('[createIntent] Updated coupon in existing transaction');
      }
      return res.json({ success: true, reused: true, transaction });
    }

    // ✅ Generate QR với totalAmount (đã có discount)
    const qrData = await vietQRService.generateIntentQRCode({ 
      totalAmount, // ✅ Dùng totalAmount đã trừ discount
      signature 
    });

    // User details snapshots
    const user = await require('../models/User').findById(req.user._id);
    let shippingAddressDetails = null;
    let phoneDetails = null;

    if (selectedAddressId && user.addresses) {
      const addr = user.addresses.id(selectedAddressId);
      if (addr) {
        shippingAddressDetails = {
          addressId: selectedAddressId,
          label: addr.label,
          address: addr.address
        };
      }
    }

    if (selectedPhoneId && user.phones) {
      const ph = user.phones.id(selectedPhoneId);
      if (ph) {
        phoneDetails = {
          phoneId: selectedPhoneId,
          label: ph.label,
          phone: ph.phone
        };
      }
    }

    // ✅ Tạo transaction với coupon info
    transaction = await VietQRTransaction.create({
      user: req.user._id,
      items: snapshotItems,
      shippingAddress,
      shippingAddressDetails,
      phone,
      phoneDetails,
      totalAmount, // ✅ Đã trừ discount
      amount: totalAmount, // ✅ Đã trừ discount
      qrCode: qrData.qrCode,
      referenceCode: qrData.referenceCode,
      bankInfo: qrData.bankInfo || null,
      expiredAt: qrData.expiredAt,
      status: 'PENDING',
      signature,
      coupon: appliedCoupon, // ✅ Lưu coupon info
      meta: { 
        notes: notes || null,
        subtotal, // ✅ Lưu subtotal để hiển thị breakdown
        shippingFee, // ✅ Lưu shipping fee
        discountAmount // ✅ Lưu discount amount
      }
    });

    console.log('[createIntent] Created new transaction:', transaction._id, 'status:', transaction.status, 'amount:', totalAmount);
    return res.json({ success: true, transaction });

  } catch (error) {
    console.error('[createIntent] error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Lỗi tạo intent VietQR' 
    });
  }
};

// GET /api/vietqr/check-status/:intentId
exports.checkIntentStatus = async (req, res) => {
  try {
    const { intentId } = req.params;
    const transaction = await VietQRTransaction.findById(intentId).populate('order');
    
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy giao dịch' });
    }
    
    if (String(transaction.user) !== String(req.user._id) && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const now = new Date();
    
    // ✅ Check hết hạn
    if (transaction.status === 'PENDING' && now > new Date(transaction.expiredAt)) {
      transaction.status = 'EXPIRED';
      await transaction.save();
      console.log('[checkIntentStatus] Transaction expired:', transaction._id);
      return res.json({ success: true, isPaid: false, transaction });
    }
    
    // ✅ Nếu đã PAID, trả về ngay
    if (transaction.status === 'PAID') {
      console.log('[checkIntentStatus] Already paid:', transaction._id);
      return res.json({ success: true, isPaid: true, transaction });
    }
    
    if (transaction.status === 'CANCELLED' || transaction.status === 'EXPIRED') {
      return res.json({ success: true, isPaid: false, transaction });
    }

    // ✅ PENDING: Kiểm tra với bank API
    const paymentCheck = await vietQRService.checkPaymentStatus(transaction);
    console.log('[checkIntentStatus] Payment check result:', paymentCheck);
    
    if (paymentCheck?.isPaid) {
      // ✅ XÁC NHẬN THANH TOÁN - CHỈ CHẠY 1 LẦN
      transaction.status = 'PAID';
      transaction.paidAt = new Date();
      await transaction.save();
      console.log('[checkIntentStatus] Payment confirmed:', transaction._id);
      
      // ✅ Tạo Order nếu chưa có (quan trọng: check transaction.order trước)
      if (!transaction.order) {
        console.log('[checkIntentStatus] Creating order for transaction:', transaction._id);

        const order = await Order.create({
          user: transaction.user,
          items: transaction.items,
          totalAmount: transaction.totalAmount,
          shippingAddress: transaction.shippingAddress,
          shippingAddressDetails: transaction.shippingAddressDetails || undefined,
          phone: transaction.phone,
          phoneDetails: transaction.phoneDetails || undefined,
          paymentMethod: 'qrcode',
          paymentStatus: 'paid',
          orderStatus: 'confirmed',
          signature: transaction.signature,
          vietQRTransaction: transaction._id,
          coupon: transaction.coupon || undefined, // ✅ Lưu coupon vào order
          meta: {
            paymentConfirmedAt: new Date(),
            qrIntentCreatedAt: transaction.createdAt,
            bankInfo: transaction.bankInfo || null,
            subtotal: transaction.meta?.subtotal,
            shippingFee: transaction.meta?.shippingFee,
            discountAmount: transaction.meta?.discountAmount
          }
        });
        
        // ✅ TĂNG usedCount của coupon - CHỈ 1 LẦN
        if (transaction.coupon?._id) {
          const updateResult = await Coupon.findByIdAndUpdate(
            transaction.coupon._id,
            { $inc: { usedCount: 1 } },
            { new: true }
          );
          
          if (updateResult) {
            console.log('[checkIntentStatus] Coupon usedCount incremented:', {
              code: transaction.coupon.code,
              oldCount: updateResult.usedCount - 1,
              newCount: updateResult.usedCount,
              maxUsage: updateResult.maxUsage
            });
          } else {
            console.warn('[checkIntentStatus] Coupon not found for increment:', transaction.coupon._id);
          }
        }

        // ✅ Lưu order ID vào transaction
        transaction.order = order._id;
        await transaction.save();
        console.log('[checkIntentStatus] Order created:', order._id);
        
        // Socket notification
        const io = req.app.get('io');
        if (io) {
          io.emit('paymentSuccess', {
            orderId: order._id.toString(),
            intentId: transaction._id.toString(),
            userId: transaction.user.toString()
          });
        }
      } else {
        console.log('[checkIntentStatus] Order already exists:', transaction.order);
      }
      
      const populatedTransaction = await VietQRTransaction.findById(transaction._id).populate('order');
      return res.json({ success: true, isPaid: true, transaction: populatedTransaction });
    }
    
    // ✅ Chưa thanh toán
    console.log('[checkIntentStatus] Not paid yet:', transaction._id);
    return res.json({ success: true, isPaid: false, transaction });
    
  } catch (error) {
    console.error('[checkIntentStatus] error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi kiểm tra trạng thái giao dịch' 
    });
  }
};

// POST /api/vietqr/intent/:intentId/cancel
exports.cancelIntent = async (req, res) => {
  try {
    const { intentId } = req.params;
    const transaction = await VietQRTransaction.findById(intentId);
    
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy giao dịch' });
    }
    
    if (String(transaction.user) !== String(req.user._id) && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    
    if (['PAID', 'EXPIRED', 'CANCELLED'].includes(transaction.status)) {
      return res.json({ 
        success: true, 
        message: 'Giao dịch không thể hủy', 
        transaction 
      });
    }
    
    transaction.status = 'CANCELLED';
    await transaction.save();
    console.log('[cancelIntent] Transaction cancelled:', transaction._id);
    
    return res.json({ 
      success: true, 
      message: 'Đã hủy giao dịch', 
      transaction 
    });
    
  } catch (error) {
    console.error('[cancelIntent] error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi hủy giao dịch' 
    });
  }
};