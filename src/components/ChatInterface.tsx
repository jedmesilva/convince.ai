import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";
import PaymentPrompt from './PaymentPrompt';
import BorderTimer from './BorderTimer';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ChatInterfaceProps {
  isUnlocked: boolean;
  onAiResponse: (response: string) => void;
  onPersuasionChange: (level: number) => void;
}

const initialMessage: Message = {
  id: 1,
  text: "540 pessoas tentaram mas falharam! Quer tentar sua sorte?",
  sender: 'ai',
  timestamp: new Date()
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ isUnlocked, onAiResponse, onPersuasionChange }) => {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [persuasionLevel, setPersuasionLevel] = useState(0);
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  const [isTimerActive, setIsTimerActive] = useState(false);
  // Duração do cronômetro em segundos (2 minutos = 120 segundos)
  const timerDuration = 120;
  // Estado para o tempo restante em segundos
  const [timeRemaining, setTimeRemaining] = useState(timerDuration);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const toggleChatExpansion = () => {
    setIsChatExpanded(prev => !prev);
  };

  useEffect(() => {
    // Só role para o final se o chat estiver expandido
    if (isChatExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatExpanded]);

  // Expanda o chat automaticamente quando uma nova mensagem chegar
  useEffect(() => {
    if (messages.length > 1 && !isChatExpanded) {
      setIsChatExpanded(true);
    }
  }, [messages]);

  // Simulação da atualização do nível de persuasão (sem WebSocket)
  // Em um cenário real, isso viria de um WebSocket
  useEffect(() => {
    // Simulação de incremento no nível de persuasão quando uma mensagem é enviada
    const handlePersuasionIncrease = () => {
      if (messages.length > 1) {
        const lastMessage = messages[messages.length - 1];

        // Apenas incremente após mensagens do usuário
        if (lastMessage.sender === 'user') {
          // Calcule um incremento baseado no tamanho da mensagem
          const messageLength = lastMessage.text.length;
          let persuasionChange = 0;

          // Algoritmo simples: mensagens mais longas são mais persuasivas
          if (messageLength > 100) persuasionChange = 15;
          else if (messageLength > 70) persuasionChange = 12;
          else if (messageLength > 50) persuasionChange = 10;
          else if (messageLength > 30) persuasionChange = 7;
          else if (messageLength > 15) persuasionChange = 5;
          else persuasionChange = 3;

          // Atualize o nível de persuasão, limitando a 100
          const newPersuasionLevel = Math.min(100, persuasionLevel + persuasionChange);
          setPersuasionLevel(newPersuasionLevel);
          
          // Notifique o componente pai sobre a mudança no nível de persuasão
          onPersuasionChange(newPersuasionLevel);
        }
      }
    };

    handlePersuasionIncrease();
  }, [messages, persuasionLevel, onPersuasionChange]);

  // Efeito para atualizar o tempo restante quando o timer estiver ativo
  useEffect(() => {
    if (!isTimerActive) {
      setTimeRemaining(timerDuration);
      return;
    }
    
    // Reset do tempo restante quando o timer é iniciado
    setTimeRemaining(timerDuration);
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          clearInterval(interval);
          // Garante que o temporizador nunca seja negativo
          return 0;
        }
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isTimerActive, timerDuration]);

  // Função para lidar com o término do tempo
  const handleTimeEnd = () => {
    toast({
      title: "Tempo esgotado!",
      description: "Seu tempo para convencer a IA acabou. Tente novamente.",
      variant: "destructive",
    });
    setIsTimerActive(false);
    // Reset do estado quando o tempo acabar
    setMessages([initialMessage]);
    setInputValue('');
    
    // Notificar o componente pai que o timer terminou para bloquear o chat
    onAiResponse('timer_ended');
    
    // Resetar o nível de persuasão
    onPersuasionChange(0);
  };
  
  // Quando o pagamento for bem-sucedido, inicie o timer
  const handlePaymentSuccess = () => {
    onAiResponse('Pagamento concluído');
    setIsTimerActive(true);
  };

  const renderMessage = (message: Message) => {
    return (
      <div 
        key={message.id}
        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
      >
        <div className={`flex items-start space-x-3 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
            message.sender === 'user' 
              ? 'bg-theme-purple text-white' 
              : 'bg-theme-dark-purple border border-theme-purple text-theme-light-purple'
          }`}>
            {message.sender === 'user' ? 'U' : 'AI'}
          </div>

          {/* Message Bubble */}
          <div 
            className={`rounded-xl px-4 py-3 ${
              message.sender === 'user' 
                ? 'bg-theme-purple text-white rounded-tr-sm' 
                : 'bg-gray-800 text-theme-light-purple border border-theme-purple rounded-tl-sm'
            }`}
          >
            <p className="text-sm leading-relaxed">{message.text}</p>
            <div className={`text-xs mt-2 ${message.sender === 'user' ? 'text-white/70' : 'text-theme-soft-purple'}`}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
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
  
  // Função para formatar o tempo no formato MM:SS
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full">
      <div className="bg-theme-dark-purple bg-opacity-80 backdrop-blur-sm border border-theme-purple rounded-xl shadow-2xl overflow-hidden relative">
        <div className="flex flex-col">
          {/* BorderTimer - Cronômetro visual nas bordas */}
          {isUnlocked && <BorderTimer 
            isActive={isTimerActive} 
            duration={timerDuration} 
            onTimeEnd={handleTimeEnd}
          />}
          {/* Header do Chat */}
          <div className="px-6 py-4 bg-theme-purple bg-opacity-20 border-b border-theme-purple border-opacity-30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <h3 className="text-lg font-semibold text-theme-light-purple">Chat com IA</h3>
                {isUnlocked && isTimerActive && (
                  <div className={`
                    font-mono text-sm px-3 py-1 rounded-full bg-theme-dark-purple border
                    ${timeRemaining <= 10 ? 'text-red-400 border-red-400 animate-pulse' : 'text-theme-vivid-purple border-theme-purple'}
                  `}>
                    {formatTime(timeRemaining)}
                  </div>
                )}
              </div>
              
              <Button
                onClick={toggleChatExpansion}
                className="h-8 w-8 rounded-full bg-theme-dark-purple border border-theme-purple p-0 shadow-md hover:bg-gray-800 flex items-center justify-center"
                variant="outline"
                size="sm"
                aria-label={isChatExpanded ? "Recolher histórico" : "Expandir histórico"}
              >
                {isChatExpanded ? (
                  <ChevronDown className="h-4 w-4 text-theme-light-purple" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-theme-light-purple" />
                )}
              </Button>
            </div>
          </div>
          {/* Área de Mensagens */}
          <div 
            className={`px-6 overflow-y-auto transition-all duration-300 ease-in-out custom-scrollbar ${
              isChatExpanded ? 'py-4 max-h-96 opacity-100' : 'max-h-0 py-0 opacity-0'
            }`}
          >
            <div className="space-y-4">
              {messages.map(renderMessage)}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 text-white rounded-xl px-4 py-3 border border-theme-purple max-w-xs">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-theme-soft-purple">IA está digitando</span>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-theme-purple rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-theme-purple rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-theme-purple rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-theme-purple border-opacity-30 bg-theme-dark-purple bg-opacity-30">
            {isUnlocked ? (
              <div className="p-4">
                <div className="relative flex items-end space-x-3">
                  <div className="flex-1">
                    <textarea
                      className="w-full bg-gray-800 border border-theme-purple border-opacity-50 rounded-xl text-white resize-none focus:outline-none focus:ring-2 focus:ring-theme-purple focus:border-theme-purple transition-all duration-200 placeholder:text-gray-400 px-4 py-3 text-sm"
                      placeholder="Digite sua mensagem para persuadir a IA..."
                      rows={2}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyPress}
                    />
                  </div>
                  <Button 
                    onClick={handleSendMessage}
                    disabled={inputValue.trim() === ''}
                    className="bg-theme-purple hover:bg-theme-vivid-purple disabled:bg-gray-600 disabled:opacity-50 text-white rounded-xl p-3 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <ArrowUp className="h-5 w-5" />
                  </Button>
                </div>
                <div className="mt-2 text-xs text-theme-soft-purple text-center">
                  Pressione Enter para enviar, Shift+Enter para nova linha
                </div>
              </div>
            ) : (
              <div className="p-4">
                <PaymentPrompt onPaymentSuccess={handlePaymentSuccess} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;