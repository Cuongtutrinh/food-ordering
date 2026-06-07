import React, { useState } from 'react';
import { FiSend } from 'react-icons/fi';

const ChatInput = ({ onSendMessage, suggestions, loading }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleSuggestionClick = (suggestion) => {
    onSendMessage(suggestion);
  };

  return (
    <div className="mt-2">
      {/* Gợi ý */}
      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 max-h-20 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700"
              disabled={loading}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Form nhập tin nhắn */}
      <form onSubmit={handleSubmit} className="flex items-center">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Nhập tin nhắn..."
          className="flex-1 border rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
          disabled={loading}
        />
        <button
          type="submit"
          className={`bg-orange-500 text-white px-4 py-2 rounded-r-lg ${
            loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-600'
          }`}
          disabled={loading || !message.trim()}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <FiSend />
          )}
        </button>
      </form>
    </div>
  );
};

export default ChatInput;