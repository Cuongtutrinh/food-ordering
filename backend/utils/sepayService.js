const axios = require('axios');
const SEPAY_CONFIG = require('../config/sepayConfig');

class SepayService {
    constructor() {
        this.api = axios.create({
            baseURL: SEPAY_CONFIG.API_URL,
            headers: {
                'Authorization': `Bearer ${SEPAY_CONFIG.API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
    }

    // Kiểm tra giao dịch mới nhất với số tiền và mã đơn hàng
    async checkLatestTransaction(amount, orderCode) {
        try {
            // Lấy danh sách giao dịch mới nhất
            const response = await this.api.get('/transactions/list', {
                params: {
                    account_number: SEPAY_CONFIG.ACCOUNT_NUMBER,
                    limit: 10, // Chỉ lấy 10 giao dịch gần nhất
                    amount_in: amount // Lọc theo số tiền nhận vào
                }
            });

            if (response.data.status === 200 && response.data.transactions) {
                // Tìm giao dịch có nội dung chứa mã đơn hàng
                const matchingTransaction = response.data.transactions.find(trans => 
                    trans.transaction_content.includes(orderCode)
                );

                if (matchingTransaction) {
                    return {
                        success: true,
                        paid: true,
                        transaction: matchingTransaction
                    };
                }
            }

            return {
                success: true,
                paid: false
            };

        } catch (error) {
            console.error('SePay API Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Khởi tạo polling để kiểm tra giao dịch
    startTransactionPolling(amount, orderCode, callback, interval = 3000) {
        const checkInterval = setInterval(async () => {
            const result = await this.checkLatestTransaction(amount, orderCode);
            
            if (result.paid) {
                clearInterval(checkInterval);
                callback(result);
            }
        }, interval);

        // Trả về hàm để dừng polling
        return () => clearInterval(checkInterval);
    }
}

module.exports = new SepayService();