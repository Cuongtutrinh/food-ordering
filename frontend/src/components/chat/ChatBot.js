import React from 'react';
import { ChatProvider } from '../../context/ChatContext';
import ChatWindow from './ChatWindow';

const ChatBot = () => {
  return (
    <ChatProvider>
      <ChatWindow />
    </ChatProvider>
  );
};

export default ChatBot;