import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ChevronDown, ArrowUp, Lock, Brain, Zap, Trophy, Square, Clock } from 'lucide-react';
import UserEmail from './UserEmail';
import PaymentCheckout from './PaymentCheckout';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from './ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { apiService, type TimeBalance, type Attempt, type Message, type AIResponse } from '../lib/api';

const INITIAL_CONVINCEMENT = 15;

// Interface para mensagens do chat
interface ChatMessage {
  id: string;
  text: string;
  timestamp: string;
  isBot: boolean;
}

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
      </div>
    </div>
  );
};

// Componente para o timer
const Timer = ({ timeLeft, isActive, isBlinking, onStopAttempt, totalTime }) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

  if (!isActive) return null;

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-violet-300/70">Tempo restante</span>
        <div className="flex items-center space-x-2">
          <button
            onClick={onStopAttempt}
            className="px-2 py-1 bg-red-400 hover:bg-red-300 text-white rounded transition-colors duration-200 flex items-center space-x-1"
            title="Parar tentativa"
          >
            <Square className="w-3 h-3 fill-current" />
            <span className="text-xs">Parar tentativa</span>
          </button>
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

// Hook customizado para timer baseado no saldo real do usuário
const useRealTimeTimer = (availableTime, isActive, onTimerEnd, userId) => {
  const [timeLeft, setTimeLeft] = useState(availableTime || 0);
  const [isBlinking, setIsBlinking] = useState(false);
  const [initialTime, setInitialTime] = useState(availableTime || 0);

  // Atualizar timeLeft quando availableTime mudar
  useEffect(() => {
    setTimeLeft(availableTime || 0);
    setInitialTime(availableTime || 0);
  }, [availableTime]);

  useEffect(() => {
    let interval = null;

    if (isActive && timeLeft > 0 && availableTime > 0) {
      interval = setInterval(async () => {
        try {
          // Decrementar 1 segundo no banco de dados
          if (userId) {
            await apiService.updateTimeBalance(userId, 1);
          }
          
          setTimeLeft(time => {
            if (time <= 1) {
              onTimerEnd();
              return 0;
            }
            return time - 1;
          });
        } catch (error) {
          console.error('Error updating time balance:', error);
          // Se falhar, ainda decrementar localmente
          setTimeLeft(time => {
            if (time <= 1) {
              onTimerEnd();
              return 0;
            }
            return time - 1;
          });
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, availableTime, onTimerEnd, userId]);

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
    setTimeLeft(availableTime || 0);
    setInitialTime(availableTime || 0);
    setIsBlinking(false);
  }, [availableTime]);

  return { timeLeft, isBlinking, resetTimer, initialTime };
};

interface MobileChatProps {
  onShowPrize?: () => void;
}

export default function MobileChat({ onShowPrize }: MobileChatProps = {}) {
  const { isAuthenticated, user } = useAuth();
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-1",
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
  const [attemptStopped, setAttemptStopped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userTimeBalance, setUserTimeBalance] = useState<TimeBalance | null>(null);
  const [availableTime, setAvailableTime] = useState(0); // tempo disponível em segundos
  
  // Novos estados para gerenciamento de tentativas
  const [currentAttempt, setCurrentAttempt] = useState<Attempt | null>(null);
  const [attemptMessages, setAttemptMessages] = useState<Message[]>([]);
  const [aiResponses, setAiResponses] = useState<AIResponse[]>([]);

  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Função para carregar saldo de tempo do usuário
  const loadUserTimeBalance = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const timeBalance = await apiService.getTimeBalance(user.id);
      setUserTimeBalance(timeBalance);
      setAvailableTime(timeBalance.amount_time_seconds || 0);
    } catch (error) {
      console.error('Error loading time balance:', error);
      setAvailableTime(0);
    }
  }, [user?.id]);

  // Função para carregar tentativa ativa do usuário (se existir)
  const loadActiveAttempt = useCallback(async () => {
    if (!user?.id) return null;
    
    try {
      console.log('Verificando tentativa ativa para usuário:', user.id);
      const activeAttempt = await apiService.getActiveAttempt(user.id);
      
      if (activeAttempt && activeAttempt.status === 'active') {
        console.log('Tentativa ativa encontrada:', activeAttempt.id);
        return activeAttempt;
      } else {
        console.log('Nenhuma tentativa ativa encontrada');
        return null;
      }
    } catch (error) {
      console.error('Erro ao carregar tentativa ativa:', error);
      return null;
    }
  }, [user?.id]);

  // Função para carregar mensagens de uma tentativa
  const loadAttemptMessages = useCallback(async (attemptId: string) => {
    try {
      const messages = await apiService.getAttemptMessages(attemptId);
      
      setAttemptMessages(messages);
      
      // Converter mensagens para o formato esperado pelo chat
      const chatMessages: ChatMessage[] = [];
      
      // Adicionar mensagem inicial
      chatMessages.push({
        id: "attempt-start",
        text: "Agora é sua chance! Tente me convencer e ganhe o prêmio!",
        timestamp: new Date().toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        isBot: true
      });
      
      // Intercalar mensagens do usuário e respostas da AI
      messages.forEach((message, index) => {
        chatMessages.push({
          id: `user-${message.id}`,
          text: message.message,
          timestamp: new Date(message.created_at).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          isBot: false
        });
        
        // Aqui adicionaríamos a resposta da AI correspondente
        // Por enquanto, vamos simular uma resposta básica
        chatMessages.push({
          id: `ai-${message.id}`,
          text: `Resposta para: "${message.message.substring(0, 30)}..."`,
          timestamp: new Date(message.created_at).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          isBot: true
        });
      });
      
      setMessages(chatMessages);
    } catch (error) {
      console.error('Error loading attempt messages:', error);
    }
  }, []);

  // Função para configurar uma tentativa (ativa ou nova) no chat
  const setupAttemptInChat = useCallback(async (attempt: any) => {
    console.log('Configurando tentativa no chat:', attempt.id);
    
    setCurrentAttempt(attempt);
    setAvailableTime(attempt.available_time_seconds);
    setConvincementLevel(attempt.convincing_score);
    
    // Carregar mensagens existentes da tentativa
    try {
      const messages = await apiService.getAttemptMessages(attempt.id);
      setAttemptMessages(messages);
      
      const chatMessages: ChatMessage[] = [
        {
          id: "attempt-start",
          text: "Agora é sua chance! Tente me convencer e ganhe o prêmio!",
          timestamp: new Date().toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          isBot: true
        }
      ];
      
      // Adicionar mensagens existentes se houver
      messages.forEach((message) => {
        chatMessages.push({
          id: `user-${message.id}`,
          text: message.message,
          timestamp: new Date(message.created_at).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          isBot: false
        });
        
        // Simular resposta da AI
        chatMessages.push({
          id: `ai-${message.id}`,
          text: `Interessante argumento, mas ainda não me convenceu...`,
          timestamp: new Date(message.created_at).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          isBot: true
        });
      });
      
      setMessages(chatMessages);
      
    } catch (error) {
      console.error('Erro ao carregar mensagens da tentativa:', error);
      // Mensagem inicial mesmo se não conseguir carregar mensagens
      setMessages([
        {
          id: "attempt-start",
          text: "Agora é sua chance! Tente me convencer e ganhe o prêmio!",
          timestamp: new Date().toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          isBot: true
        }
      ]);
    }
    
    // Desbloquear o chat
    setIsUnlocked(true);
    setIsTimerActive(true);
    setAttemptStopped(false);
    
    console.log('Chat desbloqueado para tentativa:', attempt.id);
  }, []);

  // FUNÇÃO PRINCIPAL: Desbloquear chat (verificar tentativa ativa ou criar nova)
  const handleUnlockChat = useCallback(async () => {
    if (!user?.id) {
      console.error('Usuário não autenticado');
      return;
    }

    console.log('=== INICIANDO DESBLOQUEIO DO CHAT ===');
    
    try {
      // 1. Verificar se há tentativa ativa
      console.log('1. Verificando tentativa ativa...');
      const activeAttempt = await loadActiveAttempt();
      
      if (activeAttempt) {
        // Tentativa ativa encontrada - carregar no chat
        console.log('2. Tentativa ativa encontrada - carregando no chat:', activeAttempt.id);
        await setupAttemptInChat(activeAttempt);
      } else {
        // Nenhuma tentativa ativa - verificar saldo e criar nova
        console.log('2. Nenhuma tentativa ativa - verificando saldo...');
        await loadUserTimeBalance();
        
        if (userTimeBalance && userTimeBalance.amount_time_seconds > 0) {
          console.log('3. Saldo disponível - criando nova tentativa...');
          const newAttempt = await apiService.createAttempt(userTimeBalance.amount_time_seconds);
          console.log('4. Nova tentativa criada:', newAttempt.id);
          await setupAttemptInChat(newAttempt);
        } else {
          console.log('3. Sem saldo - mostrando checkout de pagamento');
          setShowPaymentDialog(true);
        }
      }
    } catch (error) {
      console.error('Erro ao desbloquear chat:', error);
    }
  }, [user?.id, loadActiveAttempt, setupAttemptInChat, loadUserTimeBalance, userTimeBalance]);

  // Carregar dados iniciais ao montar componente
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserTimeBalance();
      // Não carregar tentativa ativa automaticamente - só no desbloqueio
    }
  }, [isAuthenticated, user, loadUserTimeBalance]);

  // Função para scroll automático
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const onTimerEnd = useCallback(async () => {
    if (currentAttempt) {
      try {
        // Marcar tentativa como falha quando o tempo acaba
        await apiService.updateAttempt(currentAttempt.id, { status: 'failed' });
      } catch (error) {
        console.error('Error updating attempt status on timeout:', error);
      }
    }

    setIsUnlocked(false);
    setIsTimerActive(false);
    setAttemptStopped(true);
    setCurrentAttempt(null);
    // Recarregar saldo após timer acabar
    loadUserTimeBalance();
  }, [currentAttempt, loadUserTimeBalance]);

  const { timeLeft, isBlinking, resetTimer, initialTime } = useRealTimeTimer(availableTime, isTimerActive, onTimerEnd, user?.id);

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

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || !isUnlocked || !currentAttempt) return;

    const messageText = inputText;
    setInputText("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = '24px';
    }

    try {
      // Salvar mensagem no banco de dados
      const savedMessage = await apiService.createMessage(currentAttempt.id, messageText);
      
      // Adicionar mensagem do usuário ao chat
      const currentTime = new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      const newMessage = {
        id: `user-${savedMessage.id}`,
        text: messageText,
        timestamp: currentTime,
        isBot: false
      };

      setMessages(prev => [...prev, newMessage]);

      // Gerar resposta da AI e atualizar score
      setTimeout(async () => {
        try {
          // Gerar resposta da AI através da API
          const response = await apiService.createAIResponse(
            currentAttempt.id, 
            savedMessage.id, 
            "Resposta gerada automaticamente", // Placeholder - será substituída pela lógica de AI no backend
            convincementLevel
          );

          const convincementChange = analyzeArgument(messageText);
          const newLevel = Math.max(0, Math.min(100, convincementLevel + convincementChange));
          updateConvincementLevel(convincementChange);

          // Atualizar score da tentativa
          await apiService.updateAttempt(currentAttempt.id, { convincing_score: newLevel });

          const botResponseText = generateBotResponse(convincementChange, newLevel);

          const botResponse = {
            id: `ai-${response.id}`,
            text: botResponseText,
            timestamp: new Date().toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            isBot: true
          };

          setMessages(prev => [...prev, botResponse]);

          // Verificar se usuário ganhou (score >= 90)
          if (newLevel >= 90) {
            // Marcar tentativa como concluída
            await apiService.updateAttempt(currentAttempt.id, { status: 'completed' });
            setIsTimerActive(false);
            setShowPrizeScreen(true);
          }
        } catch (error) {
          console.error('Error generating AI response:', error);
          // Fallback para resposta local se API falhar
          const convincementChange = analyzeArgument(messageText);
          const newLevel = Math.max(0, Math.min(100, convincementLevel + convincementChange));
          updateConvincementLevel(convincementChange);

          const botResponseText = generateBotResponse(convincementChange, newLevel);

          const botResponse = {
            id: `ai-fallback-${Date.now()}`,
            text: botResponseText,
            timestamp: new Date().toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            isBot: true
          };

          setMessages(prev => [...prev, botResponse]);
        }
      }, 1000);

    } catch (error) {
      console.error('Error sending message:', error);
      // Em caso de erro, ainda permitir interação local
      const currentTime = new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      const newMessage = {
        id: `local-${Date.now()}`,
        text: messageText,
        timestamp: currentTime,
        isBot: false
      };

      setMessages(prev => [...prev, newMessage]);
    }
  }, [inputText, isUnlocked, currentAttempt, apiService, analyzeArgument, updateConvincementLevel, convincementLevel, generateBotResponse]);

  const handlePayToUnlock = useCallback(async () => {
    // Primeiro, verificar se o usuário está autenticado
    if (!isAuthenticated || !user) {
      // Se não estiver autenticado, abrir o checkout para login/cadastro
      setShowPaymentDialog(true);
      return;
    }

    // Se estiver autenticado, verificar se tem saldo de tempo
    try {
      setIsLoading(true);
      const currentTimeBalance = await apiService.getTimeBalance(user.id);
      
      console.log('Time balance response:', currentTimeBalance);
      
      // Verificar se tem saldo de tempo disponível (mais de 0 segundos)
      const availableSeconds = currentTimeBalance?.amount_time_seconds || 0;
      
      if (availableSeconds > 0) {
        // Tem saldo - usar função principal de desbloqueio
        console.log(`Usuário tem ${availableSeconds} segundos disponíveis`);
        await handleUnlockChat();
      } else {
        // Não tem saldo - abrir checkout
        console.log('Usuário não tem saldo de tempo disponível');
        setShowPaymentDialog(true);
      }
    } catch (error) {
      console.error('Erro ao verificar saldo de tempo:', error);
      // Em caso de erro, abrir o checkout como fallback
      setShowPaymentDialog(true);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, handleUnlockChat]);

  const handlePaymentSuccess = useCallback(async () => {
    setShowPaymentDialog(false);
    
    // Recarregar saldo e desbloquear chat
    await loadUserTimeBalance();
    await handleUnlockChat();
  }, [loadUserTimeBalance, handleUnlockChat]);

  const handleClosePayment = useCallback(() => {
    setShowPaymentDialog(false);
    // Não desbloquear o chat - apenas fechar o checkout
  }, []);

  const handleStopAttempt = useCallback(async () => {
    console.log('handleStopAttempt called - currentAttempt:', currentAttempt);
    
    if (currentAttempt) {
      try {
        console.log('Tentando atualizar status da tentativa para abandoned:', currentAttempt.id);
        const result = await apiService.updateAttempt(currentAttempt.id, { status: 'abandoned' });
        console.log('Tentativa marcada como abandonada com sucesso:', result);
      } catch (error) {
        console.error('Error updating attempt status:', error);
        console.error('Error details:', error.message || error);
      }
    } else {
      console.log('Nenhuma tentativa atual para marcar como abandonada');
    }

    // Parar tentativa - resetar estado do chat
    setAttemptStopped(true);
    setIsTimerActive(false);
    setInputText("");
    setIsLoading(false);
    setIsUnlocked(false);
    setCurrentAttempt(null);
    
    // Resetar mensagens para o estado inicial
    setMessages([
      {
        id: "initial-1",
        text: "540 pessoas tentaram mas falharam! Quer tentar sua sorte?",
        timestamp: "00:19",
        isBot: true
      }
    ]);
    
    resetTimer();
    console.log('handleStopAttempt completed - chat bloqueado, tentativa parada');
  }, [currentAttempt, resetTimer]);

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
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-700 overflow-hidden">
              <img 
                src="/Vince_wht.svg" 
                alt="Vince" 
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-normal leading-none">Chat con</span>
              <h1 className="font-semibold text-lg leading-tight">Vince</h1>
            </div>
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
          isActive={isTimerActive && !attemptStopped}
          isBlinking={isBlinking}
          onStopAttempt={handleStopAttempt}
          totalTime={initialTime || availableTime}
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
          <>
            <button
              onClick={handleUnlockChat}
              disabled={isLoading}
              className="w-full bg-violet-400 hover:bg-violet-300 disabled:bg-violet-400/70 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 text-lg flex items-center justify-center space-x-2 scale-pulse hover:scale-100 hover:animate-none transform hover:scale-105 hover:shadow-xl disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Desbloquear chat</span>
                </>
              )}
            </button>
            
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
              <DialogContent className="!p-0 !m-0 !gap-0 w-[95vw] max-w-6xl h-auto min-h-[300px] max-h-[95dvh] sm:min-h-[400px] sm:max-h-[90vh] overflow-y-auto scrollbar-hide bg-transparent border-none !top-[50%] sm:!top-[50%] !rounded-2xl">
                <DialogTitle className="sr-only">
                  Checkout - Finalizar Compra
                </DialogTitle>
                <PaymentCheckout onPaymentSuccess={handlePaymentSuccess} onClose={handleClosePayment} />
              </DialogContent>
            </Dialog>
          </>
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
                email={user?.email || "user@email.com"} 
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