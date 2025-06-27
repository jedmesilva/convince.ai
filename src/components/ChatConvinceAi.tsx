import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ChevronDown, ArrowUp, Lock, Brain, Zap, Trophy } from 'lucide-react';

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
    if (level < 25) return 'from-red-600 to-red-400';
    if (level < 50) return 'from-orange-600 to-orange-400';
    if (level < 75) return 'from-yellow-600 to-yellow-400';
    return 'from-green-600 to-green-400';
  };

  const getConvincementStatus = (level) => {
    if (level < 20) return 'Não convencido';
    if (level < 40) return 'Ligeiramente convencido';
    if (level < 60) return 'Parcialmente convencido';
    if (level < 80) return 'Bem convencido';
    return 'Totalmente convencido';
  };

  return (
    <div className="px-4 pb-3 border-b border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Brain className="w-4 h-4 text-purple-400" />
          <span className="text-xs text-gray-400">Nível de Convencimento</span>
        </div>
        <div className="flex items-center space-x-2">
          {isAnimating && (
            <Zap className="w-3 h-3 text-yellow-400 animate-pulse" />
          )}
          <span className={`text-sm font-bold transition-all duration-300 ${
            isAnimating ? 'text-yellow-400' : 'text-white'
          }`}>
            {level}%
          </span>
        </div>
      </div>
      
      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
        <div 
          className={`h-3 rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${getConvincementColor(level)} ${
            isAnimating ? 'animate-pulse' : ''
          }`}
          style={{ width: `${level}%` }}
        />
      </div>
      
      <div className="flex justify-between items-center mt-1">
        <span className="text-xs text-gray-500">
          {getConvincementStatus(level)}
        </span>
        {level >= 90 && (
          <span className="text-xs text-green-400 animate-pulse">🎉 Convencido!</span>
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
    <div className="px-4 pb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">Tempo restante</span>
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
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-1000 ease-linear ${
            timeLeft <= 10 ? 'bg-red-500' : 'bg-purple-600'
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
          ? 'bg-gray-700 text-white rounded-bl-sm'
          : 'bg-purple-600 text-white rounded-br-sm'
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

export default function MobileChat() {
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
    <div className="flex flex-col h-screen bg-gray-900 text-white max-w-sm mx-auto">
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
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="font-semibold">Vince</h1>
          </div>
          <button
            onClick={handleGoToPrize}
            className="p-2 rounded-xl bg-gray-700 hover:bg-gray-600 transition-colors duration-200"
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
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        {!isUnlocked ? (
          <button
            onClick={handlePayToUnlock}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-2xl transition-colors duration-200 text-lg flex items-center justify-center space-x-2 scale-pulse hover:scale-100 hover:animate-none"
          >
            <Lock className="w-5 h-5" />
            <span>1$ para desbloquear chat</span>
          </button>
        ) : (
          <div 
            className="bg-gray-700 rounded-3xl p-4 cursor-text"
            onClick={() => textareaRef.current?.focus()}
          >
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              onInput={handleTextareaInput}
              placeholder="Digite sua mensagem..."
              className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none text-base mb-3 resize-none min-h-[24px] max-h-32 overflow-y-auto"
              rows={1}
              style={{ 
                height: 'auto',
                minHeight: '24px'
              }}
            />
            <div className="flex justify-end">
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
                className="bg-gray-900 hover:bg-black p-2 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowUp className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}