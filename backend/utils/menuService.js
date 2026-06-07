/**
 * Menu Service - Cung cấp dữ liệu về menu cho chatbot
 */
const Product = require('../models/Product');

/**
 * Lấy tất cả sản phẩm từ database để sử dụng cho chatbot
 * @returns {Array} Danh sách sản phẩm
 */
const getAllMenuItems = async () => {
  try {
    console.log('[MenuService] Đang lấy dữ liệu menu từ database...');
    
    // Lấy tất cả sản phẩm từ database
    const products = await Product.find({ available: true })
      .select('name price description category')
      .lean();
    
    console.log(`[MenuService] Đã lấy ${products.length} món ăn từ database`);
    
    // Chuyển đổi thành định dạng phù hợp cho chatbot
    const menuItems = products.map(product => ({
      name: product.name,
      price: product.price,
      description: product.description || 'Không có mô tả',
      category: product.category
    }));
    
    return menuItems;
  } catch (error) {
    console.error('[MenuService] Lỗi khi lấy dữ liệu menu:', error);
    return []; // Trả về mảng rỗng nếu có lỗi
  }
};

/**
 * Cache menu để không phải truy vấn database mỗi lần
 */
let menuCache = null;
let lastCacheTime = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 phút

/**
 * Lấy menu với cache để giảm tải database
 */
const getMenuWithCache = async () => {
  const now = Date.now();
  
  // Nếu cache còn hiệu lực
  if (menuCache && lastCacheTime && (now - lastCacheTime < CACHE_DURATION)) {
    console.log('[MenuService] Sử dụng menu từ cache');
    return menuCache;
  }
  
  // Nếu không có cache hoặc cache đã hết hạn
  console.log('[MenuService] Cache hết hạn hoặc chưa có, lấy lại từ database');
  menuCache = await getAllMenuItems();
  lastCacheTime = now;
  
  return menuCache;
};

/**
 * Xóa cache để làm mới dữ liệu
 */
const clearMenuCache = () => {
  menuCache = null;
  lastCacheTime = null;
  console.log('[MenuService] Đã xóa cache menu');
};

module.exports = {
  getAllMenuItems,
  getMenuWithCache,
  clearMenuCache
};