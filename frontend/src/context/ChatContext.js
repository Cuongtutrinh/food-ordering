import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import socket from '../utils/socket';
import { publicAPI } from '../utils/api';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user } = useAuth(); // Lấy thông tin người dùng từ AuthContext
  const [messages, setMessages] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Khởi tạo session ID dựa trên user ID nếu đã đăng nhập
  useEffect(() => {
    // Tạo key lưu trữ session ID dựa trên user
    const sessionStorageKey = user ? `chat_session_id_${user._id}` : 'chat_session_id_guest';
    
    // Kiểm tra sessionId trong localStorage cho user hiện tại
    const storedSessionId = localStorage.getItem(sessionStorageKey);
    
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      // Tạo sessionId mới cho user này - thêm prefix để phân biệt
      const newSessionId = user ? `user_${user._id}_${uuidv4()}` : `guest_${uuidv4()}`;
      localStorage.setItem(sessionStorageKey, newSessionId);
      setSessionId(newSessionId);
    }
    
    // Reset messages khi chuyển user
    setMessages([]);
    
    // Lấy gợi ý chat
    const fetchSuggestions = async () => {
      try {
        const response = await publicAPI.get('/chat/suggestions');
        setSuggestions(response.data);
      } catch (error) {
        console.error('Lỗi khi lấy gợi ý chat:', error);
      }
    };
    
    fetchSuggestions();
  }, [user]); // Chạy lại khi user thay đổi

  // Kết nối socket và lấy lịch sử chat khi sessionId thay đổi
  useEffect(() => {
    if (sessionId) {
      // Kết nối socket
      if (!socket.connected) {
        socket.connect();
        
        // Thêm log để debug
        console.log("Trying to connect to socket server...");
      }
      
      // Lắng nghe sự kiện kết nối thành công
      socket.on('connect', () => {
        console.log("Socket connected successfully with ID:", socket.id);
      });
      
      // Lắng nghe sự kiện lỗi kết nối
      socket.on('connect_error', (error) => {
        console.error("Socket connection error:", error);
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: 'bot', message: 'Không thể kết nối với máy chủ. Vui lòng thử lại sau.', timestamp: new Date() }
        ]);
      });
      
      // Lắng nghe tin nhắn từ bot
      const handleBotMessage = (data) => {
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: 'bot', message: data.message, timestamp: data.timestamp }
        ]);
        setLoading(false);
      };
      
      // Lắng nghe lỗi
      const handleError = (error) => {
        console.error('Socket error:', error);
        setLoading(false);
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: 'bot', message: 'Xin lỗi, đã có lỗi xảy ra.', timestamp: new Date() }
        ]);
      };
      
      socket.on('bot_message', handleBotMessage);
      socket.on('error', handleError);
      
      // Tải lịch sử chat cho session hiện tại
      const loadChatHistory = async () => {
        try {
          const response = await publicAPI.get(`/chat/history/${sessionId}`);
          if (response.data && Array.isArray(response.data)) {
            setMessages(response.data.map(msg => ({
              sender: msg.sender,
              message: msg.message,
              timestamp: msg.timestamp
            })));
          }
        } catch (error) {
          console.error('Lỗi khi tải lịch sử chat:', error);
        }
      };
      
      loadChatHistory();
      
      // Cleanup khi unmount hoặc sessionId thay đổi
      return () => {
        socket.off('connect');
        socket.off('connect_error');
        socket.off('bot_message', handleBotMessage);
        socket.off('error', handleError);
      };
    }
  }, [sessionId]);

  // Gửi tin nhắn đến server
  const sendMessage = async (message) => {
    if (!message.trim()) return;
    
    try {
      setLoading(true);
      
      // Thêm tin nhắn người dùng vào state
      setMessages((prevMessages) => [
        ...prevMessages, 
        { sender: 'user', message, timestamp: new Date() }
      ]);
      
      // Gửi tin nhắn qua socket với ID người dùng hiện tại
      socket.emit('user_message', {
        message,
        sessionId,
        userId: user ? user._id : null
      });
      
      // Fallback: sử dụng REST API nếu socket không kết nối
      if (!socket.connected) {
        const response = await publicAPI.post('/chat/send', {
          message,
          sessionId,
          userId: user ? user._id : null
        });
        
        setMessages((prevMessages) => [
          ...prevMessages,
          { 
            sender: 'bot', 
            message: response.data.message, 
            timestamp: response.data.timestamp 
          }
        ]);
        
        setLoading(false);
      }
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
      setLoading(false);
      
      // Thêm thông báo lỗi
      setMessages((prevMessages) => [
        ...prevMessages,
        { 
          sender: 'bot', 
          message: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.', 
          timestamp: new Date() 
        }
      ]);
    }
  };

  // Đóng/mở cửa sổ chat
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // Xóa lịch sử chat cho user hiện tại
  const clearChat = () => {
    setMessages([]);
    
    // Tạo session mới cho user hiện tại
    const newSessionId = user 
      ? `user_${user._id}_${uuidv4()}` 
      : `guest_${uuidv4()}`;
      
    const sessionStorageKey = user 
      ? `chat_session_id_${user._id}` 
      : 'chat_session_id_guest';
      
    localStorage.setItem(sessionStorageKey, newSessionId);
    setSessionId(newSessionId);
  };

  // Ngắt kết nối socket khi component unmount
  useEffect(() => {
    return () => {
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, []);

  const value = {
    messages,
    isOpen,
    loading,
    suggestions,
    sendMessage,
    toggleChat,
    clearChat,
    // Thêm thông tin user để hiển thị trong UI
    currentUser: user ? user.name : 'Khách'
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};