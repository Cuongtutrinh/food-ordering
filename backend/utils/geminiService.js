const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Khai báo biến
const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;
let model = null;
let initializedModelName = 'gemini-pro-latest'; // Sử dụng model đã xác nhận hoạt động

// Kiểm tra API key
const checkApiKey = () => {
  if (!apiKey) {
    console.error('[GeminiService] không tìm thấy GEMINI_API_KEY trong biến môi trường.');
    return false;
  }
  
  console.log(`[GeminiService] API Key được cấu hình: ${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)}`);
  return true;
};

const isAIEnabled = checkApiKey();

// Tạo system prompt
const createSystemPrompt = (menuItems = []) => {
  let prompt = `Bạn là chatbot hỗ trợ khách hàng cho nhà hàng Food Ordering. 
Nhiệm vụ của bạn là trả lời các câu hỏi về menu, món ăn, đặt hàng, thanh toán, và giao hàng.
Bạn cần trả lời bằng tiếng Việt, ngắn gọn và hữu ích.
Nếu bạn không biết câu trả lời cho câu hỏi nào đó, hãy thành thật nói rằng bạn không biết.

Thông tin về nhà hàng:
- Tên: Food Ordering
- Hotline: 0879237856
- Thời gian mở cửa: 8:00 - 22:00 hàng ngày
- Địa chỉ: Số 23, Ngõ 234 Hoàng Quốc Việt, Bắc Từ Liêm, Hà Nội
- Phương thức thanh toán: Tiền mặt, ví điện tử MoMo
- Phí giao hàng: 15.000đ cho đơn hàng dưới 100.000đ, miễn phí cho đơn hàng từ 300.000đ
- Thời gian giao hàng: 30-45 phút tùy khoảng cách

`;

  // Thêm thông tin về menu nếu có
  if (menuItems && menuItems.length > 0) {
    prompt += '\nDanh sách món ăn hiện có:\n';
    menuItems.forEach(item => {
      prompt += `- ${item.name}: ${item.price.toLocaleString()}đ - ${item.description}\n`;
    });
  }
    prompt += `
Hướng dẫn đặt hàng:
1. Gọi điện đến hotline 0879237856.
2. Đến trực tiếp nhà hàng tại địa chỉ: Số 23, Ngõ 234 Hoàng Quốc Việt, Bắc Từ Liêm, Hà Nội.
`;

  return prompt;
};

// Khởi tạo Gemini
const initializeGemini = async () => {
  if (!isAIEnabled) {
    console.log('[GeminiService] AI không được bật');
    return null;
  }

  if (model) {
    return model;
  }

  const maxRetries = 3;
  const initialDelay = 1000;
  const maxDelay = 5000;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
        console.log(`[GeminiService] Đợi ${delay}ms trước lần thử thứ ${attempt + 1}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      console.log('[GeminiService] Thử khởi tạo model với thư viện @google/generative-ai');
      genAI = new GoogleGenerativeAI(apiKey);
      
      console.log(`[GeminiService] Khởi tạo model: ${initializedModelName}`);
      model = genAI.getGenerativeModel({ model: initializedModelName });

      console.log(`[GeminiService] Khởi tạo thành công với model: ${initializedModelName}`);
      return model;

    } catch (error) {
      console.error(`[GeminiService] Lần thử ${attempt + 1}/${maxRetries} thất bại:`, error.message);
      
      // Nếu không phải lỗi 503 và không phải lần cuối, thử lại
      if (!error.message.includes('503') && attempt < maxRetries - 1) {
        continue;
      }
      
      // Reset model nếu là lần cuối
      if (attempt === maxRetries - 1) {
        model = null;
        genAI = null;
      }
    }
  }
  
  console.error('[GeminiService] Không thể khởi tạo model sau nhiều lần thử');
  return null;
};

// Xử lý khi không có phản hồi từ AI
// Cập nhật hàm handleFallback

// Xử lý khi không có phản hồi từ AI
const handleFallback = (userMessage) => {
  const messageLower = userMessage.toLowerCase();
  
  // Xử lý câu chào
  if (messageLower.includes('xin chào') || 
      messageLower.includes('hello') || 
      messageLower.includes('hi') || 
      messageLower === 'chào') {
    return "Xin chào! Tôi là trợ lý ảo của Food Ordering App. Tôi có thể giúp gì cho bạn? Bạn có thể hỏi tôi về menu, các món đặc biệt, giao hàng, hay cách đặt hàng.";
  }
  
  // Xử lý câu hỏi về đặt hàng
  if (messageLower.includes('đặt hàng') || messageLower.includes('order')) {
    return "Bạn có thể đặt hàng bằng cách: 1) Đặt trực tiếp qua chat này bằng cách cho biết món ăn và số lượng, 2) Gọi đến hotline 0879237856, hoặc 3) Đến trực tiếp nhà hàng tại Số 23, Ngõ 234 Hoàng Quốc Việt, Bắc Từ Liêm, Hà Nội.";
  }
  
  // Xử lý câu hỏi về địa chỉ
  if (messageLower.includes('địa chỉ') || messageLower.includes('cơ sở')) {
    return "Nhà hàng Food Ordering toạ lạc tại Số 23, Ngõ 234 Hoàng Quốc Việt, Bắc Từ Liêm, Hà Nội. Chúng tôi mở cửa từ 8:00 - 22:00 hàng ngày.";
  }
  
  // Xử lý câu hỏi về hotline
  if (messageLower.includes('hotline') || messageLower.includes('số điện thoại') || messageLower.includes('liên hệ')) {
    return "Bạn có thể liên hệ với chúng tôi qua hotline 0879237856, phục vụ từ 8:00 - 22:00 hàng ngày.";
  }
  
  // Xử lý câu hỏi về mỳ cay
  if (messageLower.includes('mỳ cay') || messageLower.includes('mì cay')) {
    if (messageLower.includes('cấp độ')) {
      return 'Chúng tôi có mỳ cay với 7 cấp độ cay khác nhau, phù hợp cho mọi khẩu vị.';
    }
    return 'Có, chúng tôi có bán mỳ cay. Giá mỳ cay là 45.000đ một tô. Bạn có muốn đặt không?';
  }
  
  // Xử lý các câu hỏi về menu
  if (messageLower.includes('menu') || 
      messageLower.includes('món') || 
      messageLower.includes('đồ ăn') ||
      messageLower.includes('đặc biệt')) {
    return 'Menu của chúng tôi có nhiều món hấp dẫn như Mỳ Cay (45.000đ), Bánh Mì Thịt (25.000đ), Cà Phê Sữa Đá (20.000đ), Trà Sữa Trân Châu (35.000đ) và Hamburger (50.000đ). Bạn muốn thử món nào?';
  }
  
  // Phản hồi mặc định khi không khớp với từ khóa nào
  return 'Xin lỗi, tôi không thể kết nối với hệ thống trợ lý thông minh vào lúc này. Bạn có thể hỏi về menu, đặt hàng, thanh toán hoặc giao hàng, hoặc liên hệ hotline 0879237856 để được tư vấn chi tiết.';
};

// Generate AI Response
const generateAIResponse = async (userMessage, messageHistory = [], menuItems = []) => {
  console.log('[GeminiService] Bắt đầu xử lý tin nhắn:', userMessage);
  
  if (!userMessage || userMessage.trim() === '') {
    return 'Xin lỗi, tôi không hiểu tin nhắn của bạn. Vui lòng gửi một câu hỏi cụ thể.';
  }

  // Chỉ thử khởi tạo nếu isAIEnabled = true và model chưa được khởi tạo
  if (isAIEnabled && !model) {
    try {
      await initializeGemini();
    } catch (initError) {
      console.error('[GeminiService] Không thể khởi tạo Gemini:', initError);
    }
  }

  // Nếu model không khởi tạo được, sử dụng phản hồi dự phòng
  if (!model) {
    console.log('[GeminiService] Xử lý tin nhắn theo từ khóa (fallback):', userMessage);
    return handleFallback(userMessage);
  }

  try {
    console.log('[GeminiService] Sử dụng Gemini API với model:', initializedModelName);
    
    // Tạo system prompt với thông tin menu
    const systemPrompt = createSystemPrompt(menuItems);
    
    // Chuẩn bị nội dung tin nhắn
    let fullPrompt = systemPrompt + "\n\n";
    
    // Thêm lịch sử chat (nếu có)
    if (messageHistory && messageHistory.length > 0) {
      fullPrompt += "Lịch sử trò chuyện gần đây:\n";
      const recentHistory = messageHistory.slice(-3); // Chỉ lấy 3 tin nhắn gần nhất
      for (const msg of recentHistory) {
        const role = msg.sender === 'bot' ? 'Trợ lý' : 'Người dùng';
        fullPrompt += `${role}: ${msg.message}\n`;
      }
      fullPrompt += "\n";
    }
    
    // Thêm tin nhắn hiện tại
    fullPrompt += `Người dùng: ${userMessage}\n\nTrợ lý (trả lời bằng tiếng Việt):`;
    
    console.log(`[GeminiService] Gửi prompt đến Gemini API, độ dài: ${fullPrompt.length} ký tự`);
    
    // Thiết lập cấu hình generation đơn giản
    const generationConfig = {
      temperature: 0.7,
      maxOutputTokens: 800,
    };
    
    // Gọi API với cách đơn giản nhất 
    const result = await model.generateContent(fullPrompt);
    
    // Kiểm tra kết quả
    if (!result || !result.response) {
      throw new Error('Không nhận được phản hồi từ API');
    }
    
    const responseText = result.response.text();
    if (!responseText) {
      throw new Error('Phản hồi từ Gemini API trống');
    }
    
    console.log(`[GeminiService] Nhận phản hồi từ Gemini API: "${responseText.substring(0, 50)}..."`);
    return responseText;
    
  } catch (error) {
    console.error('[GeminiService] Lỗi khi gọi Gemini API:', error.message);
    return handleFallback(userMessage);
  }
};

module.exports = {
  isAIEnabled,
  generateAIResponse,
  initializeGemini
};