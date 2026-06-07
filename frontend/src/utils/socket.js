import { io } from 'socket.io-client';

// Lấy URL API từ biến môi trường hoặc sử dụng mặc định
// Đảm bảo không có /api ở cuối URL khi kết nối socket.io
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const ENDPOINT = API_URL.replace(/\/api$/, ''); // Loại bỏ /api nếu có

console.log("Socket connecting to:", ENDPOINT);

// Khởi tạo kết nối socket
const socket = io(ENDPOINT, {
  withCredentials: true,
  autoConnect: false, // Kết nối thủ công khi cần
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000
});

export default socket;