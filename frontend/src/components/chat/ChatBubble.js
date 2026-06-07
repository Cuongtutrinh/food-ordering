import React from 'react';

const ChatBubble = ({ message, sender, timestamp }) => {
  const isBot = sender === 'bot';
  const formattedTime = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return (
    <div className={`flex w-full my-2 ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[80%] px-4 py-2 rounded-lg relative ${
          isBot 
            ? 'bg-gray-200 text-gray-800 rounded-bl-none' 
            : 'bg-orange-500 text-white rounded-br-none'
        }`}
      >
        {message}
        <div className={`text-xs mt-1 ${isBot ? 'text-gray-500' : 'text-orange-100'}`}>
          {formattedTime}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;