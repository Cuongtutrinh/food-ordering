const VietQRTransaction = require('../models/VietQRTransaction');
const Order = require('../models/Order');
const User = require('../models/User');
const Coupon = require('../models/Coupon');

exports.handleWebhook = async (req, res) => {
  try {
    console.log('=== SEPAY WEBHOOK RECEIVED ===');
    console.log('Time:', new Date().toISOString());
    console.log('Body:', JSON.stringify(req.body, null, 2));

    const {
      id,
      gateway,
      transactionDate,
      accountNumber,
      content,
      transferType,
      description,
      transferAmount,
      referenceCode: bankReferenceCode
    } = req.body;

    // ✅ Chỉ xử lý giao dịch nhận tiền
    if (transferType !== 'in') {
      console.log('❌ Ignoring non-incoming transaction');
      return res.status(200).json({ success: true, message: 'Ignored' });
    }

    // ✅ Extract FOODORDER code
    const match = content?.match(/FOODORDER\s+([A-Z0-9]{8})/i);
    if (!match) {
      console.log('❌ No FOODORDER code found in:', content);
      return res.status(200).json({ success: true, message: 'No order code' });
    }

    const orderCode = match[1].toUpperCase();
    console.log('✅ Found order code:', orderCode);

    // ✅ Tìm transaction (KHÔNG lọc status, cho phép CANCELLED/EXPIRED)
    const transaction = await VietQRTransaction.findOne({
      referenceCode: orderCode,
      totalAmount: transferAmount
    }).sort({ createdAt: -1 });

    if (!transaction) {
      console.log('❌ No transaction found for:', { orderCode, amount: transferAmount });
      
      // Debug: Show recent transactions
      const recent = await VietQRTransaction.find({})
        .select('referenceCode totalAmount status createdAt')
        .sort({ createdAt: -1 })
        .limit(5);
      console.log('Recent transactions:', recent);
      
      return res.status(200).json({ 
        success: false, 
        message: 'No matching transaction',
        debug: { orderCode, amount: transferAmount, recent }
      });
    }

    console.log('✅ Found transaction:', transaction._id, 'status:', transaction.status);

    // ✅ Nếu đã PAID, skip
    if (transaction.status === 'PAID') {
      console.log('⚠️  Transaction already paid');
      return res.status(200).json({ success: true, message: 'Already paid' });
    }

    // ✅ Validate amount (cho phép sai số 1000đ)
    const amountDiff = Math.abs(transaction.totalAmount - transferAmount);
    if (amountDiff > 1000) {
      console.log('❌ Amount mismatch:', {
        expected: transaction.totalAmount,
        received: transferAmount,
        diff: amountDiff
      });
      return res.status(200).json({ 
        success: false, 
        message: 'Amount mismatch'
      });
    }

    // ✅ CẬP NHẬT TRANSACTION SANG PAID
    const wasReactivated = ['CANCELLED', 'EXPIRED'].includes(transaction.status);
    transaction.status = 'PAID';
    transaction.paidAt = new Date(transactionDate);
    transaction.meta = {
      ...transaction.meta,
      bankTransactionId: id,
      bankReferenceCode: bankReferenceCode,
      webhookReceivedAt: new Date(),
      gateway: gateway,
      wasReactivated: wasReactivated
    };
    await transaction.save();

    console.log(`✅ Transaction updated to PAID${wasReactivated ? ' (was reactivated)' : ''}`);

    // ✅ TẠO ORDER (nếu chưa có)
    let order;
    if (!transaction.order) {
      console.log('📦 Creating order...');
      
      order = await Order.create({
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
        coupon: transaction.coupon || undefined,
        meta: {
          paymentConfirmedAt: new Date(),
          qrIntentCreatedAt: transaction.createdAt,
          bankInfo: transaction.bankInfo,
          bankTransactionId: id,
          bankReferenceCode: bankReferenceCode,
          webhookProcessedAt: new Date(),
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
          console.log('✅ Coupon usedCount incremented:', {
            code: transaction.coupon.code,
            oldCount: updateResult.usedCount - 1,
            newCount: updateResult.usedCount,
            maxUsage: updateResult.maxUsage
          });
        } else {
          console.warn('⚠️  Coupon not found for increment:', transaction.coupon._id);
        }
      }

      // Populate order
      order = await Order.findById(order._id)
        .populate('user', 'name email')
        .populate({
          path: 'items.product',
          select: 'name image price'
        });

      transaction.order = order._id;
      await transaction.save();

      console.log('✅ Order created:', order._id);

      // ✅ GỬI SOCKET EVENT
      const io = req.app.get('io');
      if (io) {
        console.log('🔔 Emitting socket events...');
        
        // Emit to specific user
        io.emit('paymentSuccess', {
          userId: transaction.user.toString(),
          orderId: order._id.toString(),
          intentId: transaction._id.toString(),
          message: 'Thanh toán thành công!'
        });

        // Emit to admin
        io.emit('newOrder', {
          order: order,
          message: `Đơn hàng mới #${order._id.toString().slice(-6).toUpperCase()}`,
          type: 'newOrder'
        });

        console.log('✅ Socket events emitted');
      } else {
        console.log('⚠️  Socket.IO not available');
      }

      // ✅ GỬI EMAIL (optional)
      try {
        const emailService = require('../utils/emailService');
        await emailService.sendOrderConfirmation(order);
        console.log('✅ Email sent');
      } catch (emailError) {
        console.error('⚠️  Email error:', emailError.message);
      }

    } else {
      console.log('⚠️  Order already exists:', transaction.order);
      order = await Order.findById(transaction.order);
    }

    console.log('=== WEBHOOK PROCESSING COMPLETE ===\n');

    return res.status(200).json({
      success: true,
      message: 'Payment processed',
      transactionId: transaction._id,
      orderId: order?._id
    });

  } catch (error) {
    console.error('💥 WEBHOOK ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal error',
      error: error.message
    });
  }
};