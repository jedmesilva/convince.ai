
import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Square, StopCircle } from 'lucide-react';
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";
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
  onStopAttempt?: () => void;
  onStartNewAttempt?: () => void;
}

const initialMessage: Message = {
  id: 1,
  text: "540 pessoas fracassaram com argumentos chulos, quer tentar algo melhor que elas?",
  sender: 'ai',
  timestamp: new Date()
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  isUnlocked, 
  onAiResponse, 
  onStopAttempt,
  onStartNewAttempt 
}) => {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attemptStopped, setAttemptStopped] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutos em segundos
  const [isTimerActive, setIsTimerActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Gerenciar timer
  useEffect(() => {
    if (isUnlocked && !attemptStopped) {
      setIsTimerActive(true);
      setTimeLeft(1800); // Reset para 30 minutos
    } else {
      setIsTimerActive(false);
    }
  }, [isUnlocked, attemptStopped]);

  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleStopAttempt();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isTimerActive, timeLeft]);

  const handlePaymentSuccess = () => {
    setAttemptStopped(false);
    setTimeLeft(1800);
    setIsTimerActive(true);
    onAiResponse('Pagamento concluído');
  };

  const handleStopAttempt = () => {
    setAttemptStopped(true);
    setInputValue('');
    setIsTyping(false);
    setIsTimerActive(false);
    setTimeLeft(1800);
    
    if (onStopAttempt) {
      onStopAttempt();
    }
    
    toast({
      title: "Tentativa finalizada",
      description: "Sua tentativa foi interrompida. Inicie uma nova tentativa para continuar.",
    });
  };

  const handleStartNewAttempt = () => {
    setMessages([initialMessage]);
    setAttemptStopped(false);
    
    if (onStartNewAttempt) {
      onStartNewAttempt();
    }
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

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
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
        <div className="px-4 py-3 overflow-y-auto" style={{ minHeight: '120px', maxHeight: '70vh' }}>
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
        
        <div className="border-t border-theme-purple px-4 py-3">
          {isUnlocked && !attemptStopped ? (
            <>
              {/* Timer e botão de parar */}
              <div className="flex items-center justify-between mb-3 px-2">
                <div className="flex items-center gap-3">
                  <div className={`text-lg font-mono ${timeLeft <= 300 ? 'text-red-400' : 'text-theme-purple'}`}>
                    ⏱️ {formatTime(timeLeft)}
                  </div>
                  <Button
                    onClick={handleStopAttempt}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg flex items-center gap-2"
                    title="Parar tentativa"
                  >
                    <StopCircle className="h-4 w-4" />
                    Parar
                  </Button>
                </div>
              </div>
              
              {/* Campo de mensagem */}
              <div className="relative flex items-center gap-2">
                <textarea
                  className="flex-1 w-full bg-gray-800 border border-theme-purple rounded-lg px-4 py-3 pr-12 text-white resize-none focus:outline-none focus:ring-1 focus:ring-theme-purple focus:bg-gray-700 transition-colors duration-200 placeholder:text-gray-500"
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
            </>
          ) : attemptStopped ? (
            <div className="text-center">
              <p className="text-gray-400 mb-4">Tentativa finalizada. Inicie uma nova para continuar.</p>
              <Button
                onClick={handleStartNewAttempt}
                className="bg-theme-purple hover:bg-theme-vivid-purple text-white px-6 py-2 rounded-lg"
              >
                Iniciar Nova Tentativa
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

