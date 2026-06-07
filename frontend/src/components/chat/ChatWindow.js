import React, { useEffect, useRef } from 'react';
import ChatBubble from './ChatBubble';
import ChatInput from './ChatInput';
import { FiX, FiMessageCircle, FiTrash2 } from 'react-icons/fi';
import { useChat } from '../../context/ChatContext';

const ChatWindow = () => {
  const { messages, isOpen, loading, suggestions, sendMessage, toggleChat, clearChat, currentUser } = useChat();
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Render nút chat khi đóng
  if (!isOpen) {
    return (
      <button
        onClick={toggleChat}
        className="fixed bottom-8 right-8 bg-orange-500 text-white p-4 rounded-full shadow-lg hover:bg-orange-600 transition-all z-50 flex items-center justify-center"
        aria-label="Mở chat"
      >
        <FiMessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-8 right-8 w-80 sm:w-96 bg-white rounded-lg shadow-xl z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-orange-500 text-white px-4 py-3 flex justify-between items-center">
        <h3 className="font-medium">
          {currentUser !== 'Khách' 
            ? `Hỗ trợ cho ${currentUser}`
            : 'Hỗ trợ trực tuyến'}
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={clearChat}
            className="text-white hover:text-gray-200"
            aria-label="Xóa lịch sử chat"
            title="Xóa lịch sử chat"
          >
            <FiTrash2 size={18} />
          </button>
          <button
            onClick={toggleChat}
            className="text-white hover:text-gray-200"
            aria-label="Đóng chat"
            title="Đóng chat"
          >
            <FiX size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto max-h-96" style={{ minHeight: '300px' }}>
        {messages.length === 0 && !loading ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Chào mừng! Hãy gửi tin nhắn để bắt đầu.</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <ChatBubble 
              key={index}
              message={msg.message}
              sender={msg.sender}
              timestamp={msg.timestamp}
            />
          ))
        )}
        {loading && (
          <div className="flex justify-start my-2">
            <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg rounded-bl-none flex items-center space-x-1">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <ChatInput
          onSendMessage={sendMessage}
          suggestions={suggestions}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default ChatWindow;