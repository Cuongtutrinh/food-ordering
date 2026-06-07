/**
 * Xử lý các câu hỏi thông dụng mà không cần qua Gemini API
 * Giúp tăng tốc độ phản hồi và giảm phụ thuộc vào API bên ngoài
 */

// Danh sách từ khóa và câu trả lời tương ứng
const directResponses = {
  // Mỳ cay
  'có bán mỳ cay không': 'Có, chúng tôi có bán mỳ cay với nhiều cấp độ cay từ 1-7. Bạn có thể chọn mức độ cay phù hợp với khẩu vị của mình.',
  'có bán mì cay không': 'Có, chúng tôi có bán mỳ cay với nhiều cấp độ cay từ 1-7. Bạn có thể chọn mức độ cay phù hợp với khẩu vị của mình.',
  'bán mỳ cay không': 'Có, chúng tôi có bán mỳ cay với nhiều cấp độ cay từ 1-7. Bạn có thể chọn mức độ cay phù hợp với khẩu vị của mình.',
  'bán mì cay không': 'Có, chúng tôi có bán mỳ cay với nhiều cấp độ cay từ 1-7. Bạn có thể chọn mức độ cay phù hợp với khẩu vị của mình.',
  'giá mỳ cay': 'Giá mỳ cay của chúng tôi từ 45.000đ đến 75.000đ tùy vào kích cỡ và cấp độ cay. Cấp độ càng cao giá sẽ tăng thêm 5.000đ/cấp.',
  'giá mì cay': 'Giá mỳ cay của chúng tôi từ 45.000đ đến 75.000đ tùy vào kích cỡ và cấp độ cay. Cấp độ càng cao giá sẽ tăng thêm 5.000đ/cấp.',
  'mỳ cay giá': 'Giá mỳ cay của chúng tôi từ 45.000đ đến 75.000đ tùy vào kích cỡ và cấp độ cay. Cấp độ càng cao giá sẽ tăng thêm 5.000đ/cấp.',
  'mì cay giá': 'Giá mỳ cay của chúng tôi từ 45.000đ đến 75.000đ tùy vào kích cỡ và cấp độ cay. Cấp độ càng cao giá sẽ tăng thêm 5.000đ/cấp.',
  
  // Burger
  'có bán burger không': 'Có, chúng tôi có bán nhiều loại burger như burger bò, burger gà, burger chay. Bạn có thể xem chi tiết trong menu.',
  'bán burger không': 'Có, chúng tôi có bán nhiều loại burger như burger bò, burger gà, burger chay. Bạn có thể xem chi tiết trong menu.',
  'giá burger': 'Giá burger dao động từ 35.000đ đến 85.000đ tùy loại. Burger bò phô mai là 65.000đ, burger gà 50.000đ, và burger chay 45.000đ.',
  
  // Trà sữa
  'có bán trà sữa không': 'Có, chúng tôi có bán trà sữa trân châu với nhiều hương vị khác nhau như truyền thống, matcha, socola.',
  'bán trà sữa không': 'Có, chúng tôi có bán trà sữa trân châu với nhiều hương vị khác nhau như truyền thống, matcha, socola.',
  'giá trà sữa': 'Giá trà sữa của chúng tôi từ 25.000đ đến 45.000đ tùy size và topping.',
  
  // Thời gian hoạt động
  'mấy giờ mở cửa': 'Chúng tôi mở cửa từ 7:00 - 22:00 mỗi ngày.',
  'mấy giờ đóng cửa': 'Chúng tôi đóng cửa vào lúc 22:00 mỗi ngày.',
  'thời gian mở cửa': 'Chúng tôi mở cửa từ 7:00 - 22:00 mỗi ngày.',
  
  // Giao hàng
  'giao hàng không': 'Có, chúng tôi có dịch vụ giao hàng tận nơi. Thời gian giao hàng khoảng 30-45 phút tùy khu vực.',
  'thời gian giao hàng': 'Thời gian giao hàng thông thường từ 30-45 phút tùy khu vực. Đơn hàng trên 200.000đ được miễn phí giao hàng.',
  'phí giao hàng': 'Phí giao hàng từ 15.000đ - 30.000đ tùy khoảng cách. Đơn hàng trên 200.000đ được miễn phí giao hàng.',
  'miễn phí giao hàng': 'Đơn hàng trên 200.000đ được miễn phí giao hàng.',
  
  // Thanh toán
  'phương thức thanh toán': 'Chúng tôi hỗ trợ thanh toán bằng tiền mặt, thẻ ngân hàng và các ví điện tử như MoMo và MB Bank.',
  'thanh toán online': 'Chúng tôi hỗ trợ thanh toán online qua thẻ ngân hàng và các ví điện tử như MoMo và MB Bank.',
};

// Danh sách từ khóa cho trường hợp mỳ cay
const myKeywords = ['mỳ cay', 'mì cay'];

/**
 * Kiểm tra nếu một tin nhắn có khớp với từ khóa đã định nghĩa sẵn
 * @param {string} message - Tin nhắn cần kiểm tra
 * @returns {string|null} - Câu trả lời hoặc null nếu không có khớp
 */
const getDirectResponse = (message) => {
  if (!message || typeof message !== 'string') {
    return null;
  }
  
  const messageLower = message.toLowerCase().trim();
  
  // Kiểm tra chính xác
  if (directResponses[messageLower]) {
    return directResponses[messageLower];
  }
  
  // Kiểm tra có chứa "mỳ cay"/"mì cay" và "không"
  if ((messageLower.includes('mỳ cay') || messageLower.includes('mì cay')) && 
      (messageLower.includes('có bán') || messageLower.includes('bán') && messageLower.includes('không'))) {
    return 'Có, chúng tôi có bán mỳ cay với nhiều cấp độ cay từ 1-7. Giá từ 45.000đ đến 75.000đ tùy vào kích cỡ và cấp độ cay.';
  }
  
  // Kiểm tra có chứa "mỳ cay"/"mì cay" và "giá"/"bao nhiêu"
  if ((messageLower.includes('mỳ cay') || messageLower.includes('mì cay')) && 
      (messageLower.includes('giá') || messageLower.includes('bao nhiêu'))) {
    return 'Giá mỳ cay của chúng tôi từ 45.000đ đến 75.000đ tùy vào kích cỡ và cấp độ cay. Cấp độ càng cao giá sẽ tăng thêm 5.000đ/cấp.';
  }
  
  // Các từ khóa khác
  for (const keyword in directResponses) {
    if (messageLower.includes(keyword)) {
      return directResponses[keyword];
    }
  }
  
  return null;
};

module.exports = {
  getDirectResponse,
  directResponses,
  myKeywords
};