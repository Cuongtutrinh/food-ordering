import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Instance cho các request cần xác thực (gửi kèm cookie và token)
export const authAPI = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Rất quan trọng để gửi và nhận cookie (bao gồm cả cookie _csrf)
});

// Instance cho các request công khai, không cần xác thực
export const publicAPI = axios.create({
  baseURL: BASE_URL,
});

// Hàm để thiết lập các interceptors một cách tuần tự
const setupInterceptors = async () => {
  // --- Interceptor 1: Đính kèm JWT token cho tất cả request của authAPI ---
  authAPI.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // --- Interceptor 2: Xử lý lỗi 401 (Unauthorized) để tự động logout ---
  authAPI.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        console.error('Unauthorized access - 401. Logging out.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Chuyển hướng về trang đăng nhập với thông báo
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );
};

// Chạy hàm thiết lập ngay khi module này được import
setupInterceptors();


// Export một object chứa các hàm gọi API đã được định nghĩa sẵn
const api = {
  // Review endpoints
  getProductReviews: (productId) => authAPI.get(`/reviews/product/${productId}`),
  canReviewProduct: (productId) => authAPI.get(`/orders/can-review/${productId}`),
  createReview: (reviewData) => authAPI.post('/reviews', reviewData),
  
  // Product endpoints
  getProducts: () => publicAPI.get('/products'),
  getProductById: (id) => publicAPI.get(`/products/${id}`),
  
  // Order endpoints
  createOrder: (orderData) => authAPI.post('/orders', orderData),
  getUserOrders: () => authAPI.get('/orders/my-orders'),
  
  // Auth endpoints
  login: (credentials) => publicAPI.post('/auth/login', credentials),
  register: (userData) => publicAPI.post('/auth/register', userData),
};

export default api;
