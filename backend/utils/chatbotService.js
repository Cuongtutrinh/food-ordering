const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const geminiService = require('./geminiService');
const menuService = require('./menuService');
const directResponseService = require('./directResponseService');

// Danh sách các từ khóa và câu trả lời
const responses = {
  greetings: [
    { keywords: ['xin chào', 'hello', 'hi', 'chào', 'hey'], 
      response: 'Xin chào! Tôi có thể giúp gì cho bạn?' },
    { keywords: ['tạm biệt', 'bye', 'goodbye'], 
      response: 'Tạm biệt! Hẹn gặp lại bạn sau.' }
  ],
  menu: [
    { keywords: ['menu', 'món ăn', 'đồ ăn', 'thực đơn', 'có món gì', 'mỳ cay', 'mì cay', 'bán mỳ cay', 'bán mì cay'], 
      response: 'Bạn có thể xem thực đơn của chúng tôi tại trang chủ. Chúng tôi có nhiều loại món ăn như burger, mì Ý, mỳ cay cấp độ 1-7, và đồ uống.' }
  ],
  orders: [
    { keywords: ['đặt hàng', 'đặt món', 'order', 'mua hàng'], 
      response: 'Để đặt hàng, bạn chỉ cần thêm món ăn vào giỏ hàng và tiến hành thanh toán. Bạn cần giúp đỡ gì thêm không?' },
    { keywords: ['trạng thái', 'đơn hàng', 'theo dõi', 'tình trạng'], 
      response: 'Bạn có thể theo dõi đơn hàng của mình trong mục "Lịch sử đơn hàng" sau khi đăng nhập.' }
  ],
  foodItems: [
    { keywords: ['mỳ cay', 'mì cay', 'có bán mỳ cay', 'có bán mì cay', 'bán mỳ cay không', 'bán mì cay không'], 
      response: 'Có, chúng tôi có bán mỳ cay với nhiều cấp độ cay từ 1-7. Bạn có thể chọn mức độ cay phù hợp với khẩu vị của mình.' },
    { keywords: ['giá mỳ cay', 'giá mì cay', 'mỳ cay giá', 'mì cay giá', 'mỳ cay bao nhiêu', 'mì cay bao nhiêu'],
      response: 'Giá mỳ cay của chúng tôi từ 45.000đ đến 75.000đ tùy vào kích cỡ và cấp độ cay. Cấp độ càng cao giá sẽ tăng thêm 5.000đ/cấp.' },
    { keywords: ['burger', 'hamburger', 'có bán burger', 'bán burger không'], 
      response: 'Có, chúng tôi có bán nhiều loại burger như burger bò, burger gà, burger chay. Bạn có thể xem chi tiết trong menu.' },
    { keywords: ['pizza', 'có bán pizza', 'bán pizza không'], 
      response: 'Có, chúng tôi có bán pizza với nhiều loại nhân như hải sản, thịt nướng, rau củ. Bạn có thể đặt trực tuyến qua ứng dụng.' }
  ],
  payment: [
    { keywords: ['thanh toán', 'payment', 'tiền', 'trả tiền', 'phương thức'], 
      response: 'Chúng tôi hỗ trợ thanh toán bằng tiền mặt và ví điện tử như MoMo.' }
  ],
  delivery: [
    { keywords: ['giao hàng', 'vận chuyển', 'ship', 'thời gian giao'], 
      response: 'Thời gian giao hàng thông thường từ 30-45 phút tùy khu vực. Đơn hàng trên 200.000đ được miễn phí giao hàng.' }
  ],
  default: 'Xin lỗi, tôi không hiểu câu hỏi của bạn. Bạn có thể hỏi về menu, món ăn (như mỳ cay, burger), đặt hàng, thanh toán hoặc giao hàng.'
};

/**
 * Xử lý tin nhắn dựa trên từ khóa
 * @param {string} message - Tin nhắn từ người dùng
 * @returns {string} - Câu trả lời
 */
const processMessageWithKeywords = (message) => {
  if (!message || typeof message !== 'string') {
    console.log('[ChatbotService] Tin nhắn không hợp lệ:', message);
    return responses.default;
  }
  
  const messageLower = message.toLowerCase().trim();
  console.log(`[ChatbotService] Tin nhắn đã chuẩn hóa: "${messageLower}"`);
  
  const tokens = tokenizer.tokenize(messageLower);
  console.log(`[ChatbotService] Các token: ${JSON.stringify(tokens)}`);
  
  // KIỂM TRA TRỰC TIẾP TRƯỜNG HỢP ĐẶC BIỆT: "CÓ BÁN MỲ CAY KHÔNG"
  if (messageLower.includes('có bán mỳ cay không') || messageLower.includes('có bán mì cay không') || 
      messageLower.includes('bán mỳ cay không') || messageLower.includes('bán mì cay không') ||
      (messageLower.includes('mỳ cay') && messageLower.includes('không')) ||
      (messageLower.includes('mì cay') && messageLower.includes('không'))) {
    console.log(`[ChatbotService] Trùng khớp đặc biệt cho "mỳ cay"`);
    return 'Có, chúng tôi có bán mỳ cay với nhiều cấp độ cay từ 1-7. Giá từ 45.000đ đến 75.000đ tùy vào kích cỡ và cấp độ cay.';
  }
  
  // Kiểm tra từng danh mục và tính điểm phù hợp
  let bestMatch = null;
  let bestScore = 0;
  
  // Kiểm tra từng danh mục
  for (const category in responses) {
    if (category === 'default') continue;
    console.log(`[ChatbotService] Kiểm tra danh mục: ${category}`);
    
    for (const item of responses[category]) {
      // Đếm số từ khóa khớp
      let matchCount = 0;
      let matchedKeywords = [];
      
      for (const keyword of item.keywords) {
        // Kiểm tra từng từ khóa
        if (messageLower.includes(keyword)) {
          matchCount++;
          matchedKeywords.push(keyword);
        }
      }
      
      // Nếu có ít nhất một từ khóa khớp
      if (matchCount > 0) {
        console.log(`[ChatbotService] Tìm thấy các từ khóa: "${matchedKeywords.join(', ')}" trong danh mục ${category}, điểm: ${matchCount}`);
        
        // Nếu điểm cao hơn điểm tốt nhất hiện tại
        if (matchCount > bestScore) {
          bestScore = matchCount;
          bestMatch = item.response;
        }
      }
    }
  }
  
  // Nếu tìm thấy kết quả phù hợp
  if (bestMatch) {
    console.log(`[ChatbotService] Phản hồi tốt nhất với điểm: ${bestScore}`);
    return bestMatch;
  }
  
  console.log('[ChatbotService] Không tìm thấy từ khóa nào, sử dụng phản hồi mặc định');
  return responses.default;
};

/**
 * Xử lý tin nhắn từ người dùng (điểm vào chính)
 * @param {string} message - Tin nhắn từ người dùng
 * @param {array} messageHistory - Lịch sử tin nhắn
 * @returns {string} - Câu trả lời của bot
 */
const processMessage = async (message, messageHistory = []) => {
  try {
    console.log(`[ChatbotService] Xử lý tin nhắn: "${message}"`);
    console.log(`[ChatbotService] AI Enabled: ${geminiService.isAIEnabled}`);
    
    // Ưu tiên sử dụng Gemini API khi có thể
    if (geminiService.isAIEnabled) {
      try {
        console.log('[ChatbotService] Đang lấy dữ liệu menu...');
        // Lấy dữ liệu menu từ database thông qua cache
        let menuItems = [];
        try {
          menuItems = await menuService.getMenuWithCache();
          console.log(`[ChatbotService] Đã lấy ${menuItems.length} món từ database`);
        } catch (menuError) {
          console.error('[ChatbotService] Lỗi khi lấy menu:', menuError);
          // Tiếp tục ngay cả khi không lấy được menu
        }
        
        console.log('[ChatbotService] Đang gọi Gemini API với dữ liệu menu...');
        
        // Truyền dữ liệu menu vào Gemini API
        const aiResponse = await geminiService.generateAIResponse(message, messageHistory, menuItems);
        
        if (aiResponse) {
          console.log(`[ChatbotService] Gemini trả lời: "${aiResponse}"`);
          return aiResponse;
        } else {
          console.log('[ChatbotService] Gemini không trả về kết quả, kiểm tra phản hồi trực tiếp');
        }
      } catch (aiError) {
        console.error('[ChatbotService] Lỗi cụ thể từ Gemini API:', aiError.message);
        console.log('[ChatbotService] Stack trace:', aiError.stack);
        console.log('[ChatbotService] Chuyển sang kiểm tra phản hồi trực tiếp do lỗi AI');
      }
    }
    
    // Nếu AI không hoạt động hoặc gặp lỗi, kiểm tra phản hồi trực tiếp
    const directResponse = directResponseService.getDirectResponse(message);
    if (directResponse) {
      console.log('[ChatbotService] Tìm thấy phản hồi trực tiếp');
      return directResponse;
    }

    // Fallback: Sử dụng phương pháp keyword nếu không có AI hoặc AI lỗi
    console.log('[ChatbotService] Sử dụng phương pháp keyword');
    const keywordResponse = processMessageWithKeywords(message);
    console.log(`[ChatbotService] Keyword trả lời: "${keywordResponse}"`);
    return keywordResponse;
  } catch (error) {
    console.error('Lỗi khi xử lý tin nhắn:', error);
    return `Xin lỗi, tôi đang gặp sự cố khi xử lý tin nhắn của bạn. Lỗi: ${error.message}`;
  }
};

/**
 * Lấy gợi ý chat
 * @returns {array} - Danh sách gợi ý
 */
const getSuggestions = () => {
  return [
    'Món đặc biệt hôm nay?',
    'Cách đặt hàng',
    'Phương thức thanh toán',
    'Có bán mỳ cay không?',
    'Thời gian giao hàng'
  ];
};

module.exports = {
  processMessage,
  getSuggestions
};