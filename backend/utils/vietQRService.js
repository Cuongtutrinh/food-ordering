const axios = require('axios');
const crypto = require('crypto');

const VIETQR_API_URL = 'https://api.vietqr.io/v2/generate';
const BANK_ID = process.env.VIETQR_BANK_ID || '970422'; // MB Bank
const ACCOUNT_NO = process.env.VIETQR_ACCOUNT_NO || '010334426789';
const ACCOUNT_NAME = process.env.VIETQR_ACCOUNT_NAME || 'TRINH TU CUONG';
const TEMPLATE = process.env.VIETQR_TEMPLATE || 'compact2';

// Generate QR code for an intent (not yet paid)
exports.generateIntentQRCode = async ({ totalAmount, signature }) => {
  try {
    const referenceCode = signature.substring(0, 8).toUpperCase();
    const addInfo = `FOODORDER ${referenceCode}`;
    
    const requestData = {
      accountNo: ACCOUNT_NO,
      accountName: ACCOUNT_NAME,
      acqId: BANK_ID,
      amount: totalAmount,
      addInfo: addInfo,
      format: 'text',
      template: TEMPLATE
    };

    console.log('Sending VietQR request:', requestData);
    
    const response = await axios.post(VIETQR_API_URL, requestData);

    if (response.data?.code === '00' && response.data?.data?.qrDataURL) {
      const expiredAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút
      
      return {
        qrCode: response.data.data.qrDataURL,
        referenceCode: referenceCode,
        bankInfo: {
          bankId: BANK_ID,
          accountNo: ACCOUNT_NO,
          accountName: ACCOUNT_NAME
        },
        expiredAt: expiredAt
      };
    }

    throw new Error('VietQR API trả về lỗi: ' + (response.data?.desc || 'Unknown error'));
  } catch (error) {
    console.error('VietQR generation error:', error.response?.data || error.message);
    throw new Error('Không thể tạo mã QR VietQR: ' + (error.response?.data?.desc || error.message));
  }
};

// ✅ FIX: Hàm kiểm tra thanh toán thực tế
// Hiện tại đang MOCK (luôn trả false), bạn cần tích hợp API ngân hàng thực
exports.checkPaymentStatus = async (transaction) => {
  try {
    // ✅ QUAN TRỌNG: Đây là MOCK, cần thay bằng API thật từ ngân hàng
    // Ví dụ: Gọi API MB Bank hoặc dùng webhook từ SePay/Casso
    
    console.log(`[vietQRService] Checking payment for transaction ${transaction._id}`);
    console.log(`[vietQRService] Reference code: ${transaction.referenceCode}`);
    console.log(`[vietQRService] Amount: ${transaction.totalAmount}`);
    
    // ❌ ĐỪNG TRẢ VỀ isPaid: true Ở ĐÂY!
    // Chỉ trả true nếu thực sự có giao dịch từ ngân hàng
    
    // TODO: Implement real bank API check
    // const bankResponse = await axios.get(`https://your-bank-api.com/check-transaction`, {
    //   params: {
    //     accountNo: ACCOUNT_NO,
    //     referenceCode: transaction.referenceCode,
    //     amount: transaction.totalAmount,
    //     from: transaction.createdAt,
    //     to: new Date()
    //   }
    // });
    
    // if (bankResponse.data?.transactions?.length > 0) {
    //   return { isPaid: true, bankTransactionId: bankResponse.data.transactions[0].id };
    // }
    
    // ✅ Mặc định luôn trả về FALSE cho đến khi có webhook/API thật xác nhận
    return { isPaid: false };
    
  } catch (error) {
    console.error('[vietQRService] Error checking payment:', error.message);
    return { isPaid: false };
  }
};

// ✅ Hàm xử lý webhook từ ngân hàng (SePay, Casso, etc.)
// Gọi hàm này từ webhook endpoint khi nhận được thông báo từ bank
exports.handleBankWebhook = async (webhookData) => {
  try {
    // Parse webhook data từ SePay/Casso
    const { 
      transactionId, 
      amount, 
      description, // Chứa referenceCode
      transactionDate 
    } = webhookData;
    
    // Extract reference code từ description
    const match = description?.match(/FOODORDER\s+([A-Z0-9]{8})/i);
    if (!match) {
      console.log('[vietQRService] No reference code found in webhook');
      return null;
    }
    
    const referenceCode = match[1].toUpperCase();
    console.log(`[vietQRService] Webhook received for reference: ${referenceCode}, amount: ${amount}`);
    
    // Tìm transaction trong DB
    const VietQRTransaction = require('../models/VietQRTransaction');
    const transaction = await VietQRTransaction.findOne({ 
      referenceCode: referenceCode,
      status: 'PENDING'
    });
    
    if (!transaction) {
      console.log('[vietQRService] Transaction not found or already processed');
      return null;
    }
    
    // Kiểm tra số tiền khớp
    if (Math.abs(transaction.totalAmount - amount) > 1000) { // Cho phép sai số 1k
      console.log('[vietQRService] Amount mismatch:', transaction.totalAmount, 'vs', amount);
      return null;
    }
    
    // ✅ XÁC NHẬN THANH TOÁN
    transaction.status = 'PAID';
    transaction.paidAt = new Date(transactionDate);
    transaction.meta = {
      ...transaction.meta,
      bankTransactionId: transactionId,
      webhookReceivedAt: new Date()
    };
    await transaction.save();
    
    console.log(`[vietQRService] Payment confirmed for transaction ${transaction._id}`);
    
    return transaction;
    
  } catch (error) {
    console.error('[vietQRService] Webhook processing error:', error);
    throw error;
  }
};