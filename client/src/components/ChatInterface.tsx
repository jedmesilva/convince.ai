import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import PaymentOverlay from './PaymentOverlay';
import { useAIChat } from '@/contexts/AIChatContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: string;
}

interface ChatInterfaceProps {
  showPaymentOverlay: boolean;
  onTryButtonClick: () => void;
  onUnlockChat: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  showPaymentOverlay, 
  onTryButtonClick,
  onUnlockChat
}) => {
  const [inputValue, setInputValue] = useState('');
  const { messages, sendMessage } = useAIChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-grow flex flex-col bg-[#0A0A0A] rounded-xl border border-gray-800 overflow-hidden">
      {/* Message Container */}
      <div className="message-container flex-grow overflow-y-auto p-4 space-y-3">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`
              ${message.isUser 
                ? 'bg-primary bg-opacity-20 rounded-lg p-3 max-w-[85%] ml-auto' 
                : 'bg-gray-800 rounded-lg p-3 max-w-[85%]'
              }
            `}
          >
            <p className="text-sm">{message.text}</p>
            <span className="text-xs text-gray-400 mt-1 block">{formatTime(message.timestamp)}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Chat Input Area */}
      <div className="chat-input-area border-t border-gray-800 p-3 relative">
        {showPaymentOverlay && (
          <PaymentOverlay 
            onTryButtonClick={onTryButtonClick} 
            failedAttempts={540}
          />
        )}
        
        <div className="flex items-center">
          <Input
            type="text"
            placeholder="Digite sua mensagem..."
            className="w-full bg-gray-800 text-white rounded-r-none focus:outline-none focus:ring-1 focus:ring-primary"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={showPaymentOverlay}
          />
          <Button 
            onClick={handleSendMessage} 
            className="bg-primary text-white p-2 rounded-l-none"
            disabled={showPaymentOverlay}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
