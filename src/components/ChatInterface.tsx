
import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";
import { Progress } from "../components/ui/progress";
import PaymentPrompt from './PaymentPrompt';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ChatInterfaceProps {
  isUnlocked: boolean;
  onAiResponse: (response: string) => void;
}

const initialMessage: Message = {
  id: 1,
  text: "540 pessoas tentaram mas falharam! Quer tentar sua sorte?",
  sender: 'ai',
  timestamp: new Date()
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ isUnlocked, onAiResponse }) => {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [persuasionLevel, setPersuasionLevel] = useState(0);
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();
  
  const toggleChatExpansion = () => {
    setIsChatExpanded(prev => !prev);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Set up WebSocket connection
  useEffect(() => {
    // Function to establish WebSocket connection
    const connectWebSocket = () => {
      // Close any existing connection
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      // Create WebSocket connection
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      
      // Handle connection open
      socket.onopen = () => {
        console.log('WebSocket connection established');
        
        // Get session ID from cookies
        const cookies = document.cookie.split(';').map(cookie => cookie.trim());
        const sessionIdCookie = cookies.find(cookie => cookie.startsWith('sessionId='));
        const sessionId = sessionIdCookie ? sessionIdCookie.split('=')[1] : null;
        
        if (sessionId) {
          // Register with session ID
          socket.send(JSON.stringify({
            type: 'register',
            sessionId
          }));
        } else {
          console.log('No session ID found in cookies');
        }
      };
      
      // Handle messages from server
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'persuasionUpdate') {
            setPersuasionLevel(data.level);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      // Handle errors
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      // Handle connection close
      socket.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        
        // Try to reconnect after a delay if not closing intentionally
        if (event.code !== 1000) {
          setTimeout(connectWebSocket, 3000);
        }
      };
    };
    
    // Connect
    connectWebSocket();
    
    // Clean up on component unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const handlePaymentSuccess = () => {
    onAiResponse('Pagamento concluído');
  };

  const renderMessage = (message: Message) => {
    return (
      <div 
        key={message.id}
        className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
      >
        <div 
          className={`max-w-[80%] rounded-lg px-4 py-2 ${
            message.sender === 'user' 
              ? 'bg-theme-purple text-white' 
              : 'bg-gray-800 text-theme-light-purple border border-theme-purple'
          }`}
        >
          <p>{message.text}</p>
          <div className="text-xs opacity-70 mt-1">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    );
  };

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const aiResponse = getAiResponse(inputValue);
      
      const aiMessage: Message = {
        id: messages.length + 2,
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, aiMessage]);
      setIsTyping(false);
      onAiResponse(aiResponse);
    }, 2000);
  };

  const getAiResponse = (userMessage: string): string => {
    const userMessageLower = userMessage.toLowerCase();
    
    if (userMessageLower.includes("por favor") && (userMessageLower.includes("preciso") || userMessageLower.includes("necessito"))) {
      return "Entendo sua situação, mas preciso de argumentos mais convincentes.";
    } else if (userMessageLower.includes("doar") && userMessageLower.includes("caridade")) {
      return "Nobre da sua parte pensar em caridade, mas preciso de um motivo realmente excepcional.";
    } else if (userMessageLower.includes("investir") && (userMessageLower.includes("negócio") || userMessageLower.includes("startup"))) {
      return "Uma ideia de negócio interessante, mas muitos antes de você já tentaram esse argumento.";
    } else {
      return "Hmm, não estou convencida. Tente novamente com um argumento mais original e persuasivo!";
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
      <div className="flex flex-col bg-theme-dark-purple border border-theme-purple rounded-lg shadow-xl overflow-hidden">
        <div className="px-4 pt-4 pb-2 relative">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-white/70">Nível de persuasão</span>
            <span className="text-xs text-white/70 font-medium">{persuasionLevel}%</span>
          </div>
          <Progress 
            value={persuasionLevel} 
            className="h-2 bg-gray-700 w-full" 
            indicatorClassName={
              persuasionLevel < 30 
                ? "bg-red-500" 
                : persuasionLevel < 70 
                  ? "bg-yellow-500" 
                  : "bg-green-500"
            }
          />
          <Button
            onClick={toggleChatExpansion}
            className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 h-8 w-8 rounded-full bg-theme-dark-purple border border-theme-purple p-0 z-10 shadow-md"
            variant="outline"
            size="sm"
          >
            {isChatExpanded ? (
              <ChevronDown className="h-4 w-4 text-theme-purple" />
            ) : (
              <ChevronUp className="h-4 w-4 text-theme-purple" />
            )}
          </Button>
        </div>
        <div 
          className={`px-4 py-3 overflow-y-auto transition-all duration-300 ease-in-out ${
            isChatExpanded ? 'h-auto opacity-100' : 'h-0 opacity-0 invisible'
          }`} 
          style={isChatExpanded ? { minHeight: '120px', maxHeight: '50vh' } : {}}>
          {messages.map(renderMessage)}
          
          {isTyping && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-800 text-white rounded-lg px-4 py-2 border border-theme-purple">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-theme-purple rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-theme-purple rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-theme-purple rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="border-t border-theme-purple">
          {isUnlocked ? (
            <div className="relative flex items-center">
              <textarea
                className="flex-1 w-full bg-gray-800 border-0 rounded-none text-white resize-none focus:outline-none focus:ring-1 focus:ring-theme-purple focus:bg-gray-700 transition-colors duration-200 placeholder:text-gray-500 px-4 py-3 pr-12"
                placeholder="Digite sua mensagem..."
                rows={2}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={inputValue.trim() === ''}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-theme-purple hover:bg-theme-vivid-purple text-white rounded-full p-2"
              >
                <ArrowUp className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <PaymentPrompt onPaymentSuccess={handlePaymentSuccess} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;

