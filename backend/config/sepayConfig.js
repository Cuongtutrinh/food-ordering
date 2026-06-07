// Cấu hình SePay API
const SEPAY_CONFIG = {
    API_URL: 'https://my.sepay.vn/userapi',
    API_TOKEN: '2GKCD0IQL9X9JNDF4FDXPLTOUSIEU8PCH6687S5PXADUQBAOCUIH3QTMHKRBN3JH',
    ACCOUNT_NUMBER: process.env.BANK_ACCOUNT // Số tài khoản MB của bạn
};

module.exports = SEPAY_CONFIG;