import React, { createContext, useContext, useState } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: string;
}

interface AIChatContextType {
  messages: Message[];
  sendMessage: (message: string) => void;
  resetChat: () => void;
}

// Create context with default values to avoid undefined check
const defaultContextValue: AIChatContextType = {
  messages: [],
  sendMessage: () => {},
  resetChat: () => {}
};

const AIChatContext = createContext<AIChatContextType>(defaultContextValue);

export const useAIChat = () => {
  return useContext(AIChatContext);
};

export const AIChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "540 pessoas fracassaram com argumentos chulos, quer tentar algo melhor que elas?",
      isUser: false,
      timestamp: new Date().toISOString()
    }
  ]);

  const sendMessage = async (text: string) => {
    // Add user message
    const userMessage: Message = {
      text,
      isUser: true,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
      // Send message to API and get response
      const response = await apiRequest('POST', '/api/chat', { message: text });
      const data = await response.json();
      
      // Add AI response
      const aiMessage: Message = {
        text: data.response,
        isUser: false,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Fallback response in case of error
      const fallbackMessage: Message = {
        text: "Desculpe, tive um problema ao processar sua mensagem. Pode tentar novamente?",
        isUser: false,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        text: "Ótimo! Agora me diga, por que você merece ganhar o prêmio acumulado de R$ 5.401?",
        isUser: false,
        timestamp: new Date().toISOString()
      }
    ]);
  };
  
  const value = { messages, sendMessage, resetChat };

  return (
    <AIChatContext.Provider value={value}>
      {children}
    </AIChatContext.Provider>
  );
};
