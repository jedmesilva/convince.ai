import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ChevronDown, ArrowUp, Lock, Brain, Zap, Trophy } from 'lucide-react';
import UserEmail from './UserEmail';
import PaymentCheckout from './PaymentCheckout';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';

const TIMER_DURATION = 30;
const INITIAL_CONVINCEMENT = 15;

// Constantes para análise de argumentos
const ARGUMENT_ANALYSIS = {
  positiveWords: ['porque', 'evidência', 'prova', 'fato', 'lógico', 'razão', 'estudo', 'pesquisa', 'científico', 'dados', 'estatística', 'expert', 'especialista'],
  strongPositiveWords: ['comprovado', 'inquestionável', 'óbvio', 'definitivo', 'irrefutável'],
  negativeWords: ['acho', 'talvez', 'parece', 'suponho', 'acredito', 'opinião', 'sentimento'],
  scores: {
    positive: 8,
    strongPositive: 15,
    negative: -5,
    lengthBonus100: 5,
    lengthBonus200: 10,
    numberBonus: 8,
    capsLockPenalty: -10
  }
};

// Componente para o medidor de convencimento
const ConvincementMeter = ({ level, isAnimating }) => {
  const getConvincementColor = (level) => {
    if (level < 25) return 'from-violet-800 to-violet-600';
    if (level < 50) return 'from-violet-700 to-violet-500';
    if (level < 75) return 'from-violet-600 to-violet-400';
    return 'from-violet-500 to-violet-300';
  };

  const getConvincementStatus = (level) => {
    if (level < 20) return 'Não convencido';
    if (level < 40) return 'Ligeiramente convencido';
    if (level < 60) return 'Parcialmente convencido';
    if (level < 80) return 'Bem convencido';
    return 'Totalmente convencido';
  };

  return (
    <div className="px-4 py-4 border-b border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Brain className="w-4 h-4 text-violet-400" />
          <span className="text-xs text-violet-300/70">Nível de Convencimento</span>
        </div>
        <div className="flex items-center space-x-2">
          {isAnimating && (
            <Zap className="w-3 h-3 text-violet-300 animate-pulse" />
          )}
          <span className={`text-sm font-bold transition-all duration-300 ${
            isAnimating ? 'text-violet-300' : 'text-white'
          }`}>
            {level}%
          </span>
        </div>
      </div>
      
      <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
        <div 
          className={`h-3 rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${getConvincementColor(level)} ${
            isAnimating ? 'animate-pulse' : ''
          }`}
          style={{ width: `${level}%` }}
        />
      </div>
      
      <div className="flex justify-between items-center mt-1">
        <span className="text-xs text-violet-300/60">
          {getConvincementStatus(level)}
        </span>
        {level >= 90 && (
          <span className="text-xs text-violet-300 animate-pulse">🎉 Convencido!</span>
        )}
      </div>
    </div>
  );
};

// Componente para o timer
const Timer = ({ timeLeft, isActive, isBlinking }) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = ((TIMER_DURATION - timeLeft) / TIMER_DURATION) * 100;

  if (!isActive) return null;

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-violet-300/70">Tempo restante</span>
        <span 
          className={`text-sm font-mono font-bold transition-colors duration-200 ${
            timeLeft <= 10 
              ? `${isBlinking ? 'text-red-500' : 'text-red-300'}` 
              : 'text-white'
          }`}
        >
          {formatTime(timeLeft)}
        </span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-1000 ease-linear ${
            timeLeft <= 10 ? 'bg-red-500' : 'bg-violet-400'
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
};

// Componente para mensagem individual
const Message = ({ message }) => (
  <div className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}>
    <div
      className={`max-w-xs px-4 py-3 rounded-2xl ${
        message.isBot
          ? 'bg-slate-700 text-white rounded-bl-sm'
          : 'bg-violet-400 text-white rounded-br-sm'
      }`}
    >
      <p className="text-sm leading-relaxed">{message.text}</p>
      <p className="text-xs text-gray-300 mt-1 opacity-70">
        {message.timestamp}
      </p>
    </div>
  </div>
);

// Hook customizado para timer
const useTimer = (initialTime, isActive, onTimerEnd) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    let interval = null;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            onTimerEnd();
            return initialTime;
          }
          return time - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, initialTime, onTimerEnd]);

  useEffect(() => {
    let blinkInterval = null;
    
    if (timeLeft <= 10 && timeLeft > 0 && isActive) {
      blinkInterval = setInterval(() => {
        setIsBlinking(prev => !prev);
      }, 500);
    } else {
      setIsBlinking(false);
    }
    
    return () => {
      if (blinkInterval) clearInterval(blinkInterval);
    };
  }, [timeLeft, isActive]);

  const resetTimer = useCallback(() => {
    setTimeLeft(initialTime);
    setIsBlinking(false);
  }, [initialTime]);

  return { timeLeft, isBlinking, resetTimer };
};

interface MobileChatProps {
  onShowPrize?: () => void;
}

export default function MobileChat({ onShowPrize }: MobileChatProps = {}) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "540 pessoas tentaram mas falharam! Quer tentar sua sorte?",
      timestamp: "00:19",
      isBot: true
    }
  ]);
  
  const [inputText, setInputText] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [convincementLevel, setConvincementLevel] = useState(INITIAL_CONVINCEMENT);
  const [isConvincementAnimating, setIsConvincementAnimating] = useState(false);
  const [showPrizeScreen, setShowPrizeScreen] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Função para scroll automático
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const onTimerEnd = useCallback(() => {
    setIsUnlocked(false);
    setIsTimerActive(false);
  }, []);

  const { timeLeft, isBlinking, resetTimer } = useTimer(TIMER_DURATION, isTimerActive, onTimerEnd);

  // Função otimizada para análise de argumentos
  const analyzeArgument = useCallback((text) => {
    const lowerText = text.toLowerCase();
    let change = 0;
    
    const { positiveWords, strongPositiveWords, negativeWords, scores } = ARGUMENT_ANALYSIS;
    
    // Análise de palavras positivas
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) change += scores.positive;
    });
    
    strongPositiveWords.forEach(word => {
      if (lowerText.includes(word)) change += scores.strongPositive;
    });
    
    // Análise de palavras negativas
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) change += scores.negative;
    });
    
    // Bônus por tamanho
    if (text.length > 100) change += scores.lengthBonus100;
    if (text.length > 200) change += scores.lengthBonus200;
    
    // Bônus por números
    if (/\d+/.test(text)) change += scores.numberBonus;
    
    // Penalidade por CAPS
    if (text === text.toUpperCase() && text.length > 10) {
      change += scores.capsLockPenalty;
    }
    
    return Math.max(-20, Math.min(25, change));
  }, []);

  // Função para atualizar nível de convencimento
  const updateConvincementLevel = useCallback((change) => {
    setIsConvincementAnimating(true);
    
    setTimeout(() => {
      setConvincementLevel(prev => Math.max(0, Math.min(100, prev + change)));
      setTimeout(() => setIsConvincementAnimating(false), 500);
    }, 200);
  }, []);

  // Função para gerar resposta do bot
  const generateBotResponse = useCallback((convincementChange, newLevel) => {
    if (convincementChange > 15) {
      return "Uau! Esse é um argumento muito forte! Estou impressionado com sua lógica.";
    } else if (convincementChange > 8) {
      return "Muito bom ponto! Você está me convencendo cada vez mais.";
    } else if (convincementChange > 0) {
      return "Entendo seu ponto. Continue, estou ouvindo...";
    } else if (convincementChange < -5) {
      return "Hmm, esse argumento não me convence muito. Tem algo mais sólido?";
    }
    
    if (newLevel >= 90) {
      return "🎉 Parabéns! Você me convenceu completamente! Seus argumentos são irrefutáveis!";
    }
    
    return "Interessante perspectiva. O que mais você tem a dizer?";
  }, []);

  const handleSendMessage = useCallback(() => {
    if (!inputText.trim() || !isUnlocked) return;
    
    const convincementChange = analyzeArgument(inputText);
    const currentTime = new Date().toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    const newMessage = {
      id: Date.now(), // Usando timestamp para ID único
      text: inputText,
      timestamp: currentTime,
      isBot: false
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputText("");
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = '24px';
    }
    
    updateConvincementLevel(convincementChange);
    
    // Resposta do bot
    setTimeout(() => {
      const newLevel = Math.max(0, Math.min(100, convincementLevel + convincementChange));
      const botResponseText = generateBotResponse(convincementChange, newLevel);
      
      const botResponse = {
        id: Date.now() + 1,
        text: botResponseText,
        timestamp: new Date().toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        isBot: true
      };
      
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  }, [inputText, isUnlocked, analyzeArgument, updateConvincementLevel, convincementLevel, generateBotResponse]);

  const handlePayToUnlock = useCallback(() => {
    setShowPaymentDialog(true);
  }, []);

  const handlePaymentSuccess = useCallback(() => {
    setShowPaymentDialog(false);
    setIsUnlocked(true);
    resetTimer();
    setIsTimerActive(true);
  }, [resetTimer]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey && isUnlocked) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [isUnlocked, handleSendMessage]);

  const handleGoToPrize = useCallback(() => {
    setShowPrizeScreen(true);
  }, []);

  const handleBackToChat = useCallback(() => {
    setShowPrizeScreen(false);
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-800 text-white w-full border-l border-slate-700">
      <style>{`
        @keyframes scale-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        .scale-pulse {
          animation: scale-pulse 1.2s ease-in-out infinite;
        }
      `}</style>
      
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="font-semibold">Vince</h1>
          </div>
          <button
            onClick={onShowPrize || handleGoToPrize}
            className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 transition-colors duration-200"
            title="Ver prêmios disponíveis"
          >
            <Trophy className="w-5 h-5 text-purple-400" />
          </button>
        </div>
        
        <ConvincementMeter 
          level={convincementLevel} 
          isAnimating={isConvincementAnimating} 
        />
        
        <Timer 
          timeLeft={timeLeft}
          isActive={isTimerActive}
          isBlinking={isBlinking}
        />
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-800 border-t border-slate-700">
        {!isUnlocked ? (
          <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
            <DialogTrigger asChild>
              <button
                className="w-full bg-violet-400 hover:bg-violet-300 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 text-lg flex items-center justify-center space-x-2 scale-pulse hover:scale-100 hover:animate-none transform hover:scale-105 hover:shadow-xl"
              >
                <Lock className="w-5 h-5" />
                <span>1$ para desbloquear chat</span>
              </button>
            </DialogTrigger>
            <DialogContent className="p-0 w-[95vw] max-w-6xl h-auto min-h-[300px] max-h-[95dvh] sm:min-h-[400px] sm:max-h-[90vh] overflow-y-auto bg-transparent border-none !top-[50%] sm:!top-[50%]">
              <div className="sr-only">
                <h2>Checkout - Finalizar Compra</h2>
                <p>Complete seu pagamento para desbloquear o chat</p>
              </div>
              <PaymentCheckout onPaymentSuccess={handlePaymentSuccess} />
            </DialogContent>
          </Dialog>
        ) : (
          <div 
            className="bg-slate-700 rounded-3xl p-4 cursor-text"
            onClick={(e) => {
              // Só foca se não clicou no email ou em seus elementos filhos
              const target = e.target as HTMLElement;
              if (!target?.closest || !target.closest('[data-user-email]')) {
                textareaRef.current?.focus();
              }
            }}
          >
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
              placeholder="Digite sua mensagem..."
              className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none text-base mb-3 resize-none min-h-[24px] max-h-32 overflow-y-auto"
              rows={1}
              style={{ 
                height: 'auto',
                minHeight: '24px'
              }}
            />
            <div className="flex justify-between items-center">
              <UserEmail 
                email="lucas@email.com" 
                compact={true}
                onClick={() => console.log('Clicou no email do usuário')}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
                className="group relative bg-violet-400 hover:bg-violet-300 text-white p-2 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
              >
                <ArrowUp className="w-4 h-4 text-white" />
                <div className="absolute inset-0 bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}