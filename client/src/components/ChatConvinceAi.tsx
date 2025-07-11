import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronDown, ArrowUp, Lock, Brain, Zap, Trophy, Square, Clock, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserEmail from './UserEmail';
import PaymentCheckout from './PaymentCheckout';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { apiService, type TimeBalance, type Attempt, type Message, type AIResponse } from '../lib/api';

const INITIAL_CONVINCEMENT = 0;

// Interface para mensagens do chat
interface ChatMessage {
  id: string;
  text: string;
  timestamp: string;
  isBot: boolean;
}

// Estados do chat conforme fluxograma
type ChatState = 'user_not_authenticated' | 'user_authenticated_no_balance' | 'user_authenticated_has_balance' | 'attempt_active' | 'attempt_expired' | 'attempt_abandoned';

// Interface props
interface MobileChatProps {
  onShowPrize?: () => void;
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
        <div className="flex items-center space-x-2">
          <span className="text-xs text-violet-300/70">Tempo restante</span>
        </div>
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

export default function ChatConvinceAi({ onShowPrize }: MobileChatProps = {}) {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  
  // Estados principais do sistema
  const [chatState, setChatState] = useState<ChatState>('user_not_authenticated');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-1",
      text: "540 pessoas tentaram mas falharam! Quer tentar sua sorte?",
      timestamp: "00:19",
      isBot: true
    }
  ]);

  const [inputText, setInputText] = useState("");
  const [convincementLevel, setConvincementLevel] = useState(INITIAL_CONVINCEMENT);
  const [isConvincementAnimating, setIsConvincementAnimating] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para gerenciamento de tentativas e tempo
  const [userTimeBalance, setUserTimeBalance] = useState<TimeBalance | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<Attempt | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);
  const [initialTime, setInitialTime] = useState(0);

  // WebSocket para receber atualizações em tempo real
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);

  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  // ==== WEBSOCKET PARA TEMPO REAL ====
  
  // Conectar ao WebSocket quando há uma tentativa ativa
  const connectWebSocket = useCallback((attemptId: string) => {
    if (websocket) {
      websocket.close();
    }

    const wsUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'ws://localhost:3001' 
      : `wss://${window.location.hostname}:3001`;

    console.log('🔌 Conectando ao WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('✅ WebSocket conectado');
      // Registrar para receber atualizações desta tentativa
      ws.send(JSON.stringify({
        type: 'subscribe_attempt',
        attemptId: attemptId
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 Mensagem WebSocket recebida:', data);

        if (data.type === 'attempt_updated' && data.attemptId === attemptId) {
          // Atualizar o convincing_score em tempo real
          const newScore = data.convincing_score;
          console.log('🎯 Atualizando convincing_score em tempo real:', newScore);
          
          setConvincementLevel(newScore);
          setIsConvincementAnimating(true);
          setTimeout(() => setIsConvincementAnimating(false), 1000);
        }

        if (data.type === 'ai_response_created' && data.attemptId === attemptId) {
          // Nova resposta da AI criada - adicionar ao chat
          console.log('🤖 Nova resposta da AI recebida em tempo real:', data);
          
          const aiMessage = {
            id: `ai-${data.aiResponseId}`,
            text: data.aiResponse,
            timestamp: new Date().toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            isBot: true
          };

          setMessages(prev => [...prev, aiMessage]);
        }
      } catch (error) {
        console.error('Erro ao processar mensagem WebSocket:', error);
      }
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket desconectado');
    };

    ws.onerror = (error) => {
      console.error('❌ Erro no WebSocket:', error);
    };

    setWebsocket(ws);
  }, [websocket]);

  // Desconectar WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (websocket) {
      console.log('🔌 Fechando conexão WebSocket');
      websocket.close();
      setWebsocket(null);
    }
  }, [websocket]);

  // Cleanup WebSocket ao desmontar componente
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, [disconnectWebSocket]);

  // Carregar mensagens de uma tentativa
  const loadAttemptMessages = useCallback(async (attemptId: string) => {
    try {
      console.log('📝 Carregando mensagens da tentativa:', attemptId);
      
      // Carregar mensagens do usuário
      const userMessages = await apiService.getAttemptMessages(attemptId);
      
      // Carregar respostas da AI
      const aiResponses = await apiService.getAttemptAiResponses(attemptId);
      
      // Combinar e ordenar todas as mensagens por timestamp
      const allMessages: ChatMessage[] = [];
      
      // Adicionar mensagens do usuário
      userMessages.forEach(msg => {
        allMessages.push({
          id: `user-${msg.id}`,
          text: msg.message,
          timestamp: new Date(msg.created_at).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          isBot: false
        });
      });
      
      // Adicionar respostas da AI
      aiResponses.forEach(response => {
        allMessages.push({
          id: `ai-${response.id}`,
          text: response.ai_response,
          timestamp: new Date(response.created_at).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          isBot: true
        });
      });
      
      // Ordenar por timestamp
      allMessages.sort((a, b) => {
        const timeA = new Date(`2024-01-01 ${a.timestamp}`).getTime();
        const timeB = new Date(`2024-01-01 ${b.timestamp}`).getTime();
        return timeA - timeB;
      });
      
      console.log('📝 Mensagens carregadas:', allMessages.length);
      setMessages(allMessages);
      
    } catch (error) {
      console.error('Erro ao carregar mensagens da tentativa:', error);
      // Manter mensagem inicial se não conseguir carregar
      setMessages([
        {
          id: "initial-1",
          text: "Tentativa retomada! Continue tentando me convencer!",
          timestamp: new Date().toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          isBot: true
        }
      ]);
    }
  }, []);

  // ==== FUNÇÕES PRINCIPAIS DO FLUXOGRAMA ====

  // 1. Verificação de autenticação do usuário
  const checkUserAuthentication = useCallback(() => {
    console.log('🔍 Verificando autenticação do usuário...');
    return isAuthenticated && user;
  }, [isAuthenticated, user]);

  // 2. Verificar se usuário já existe no sistema
  const checkUserExists = useCallback(async (email: string) => {
    try {
      const result = await apiService.checkEmail(email);
      return result.exists;
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
      return false;
    }
  }, []);

  // 3. Verificar saldo de tempo do usuário
  const checkUserTimeBalance = useCallback(async () => {
    if (!user?.id) return 0;
    
    try {
      console.log('⏱️ Verificando saldo de tempo do usuário...');
      const timeBalance = await apiService.getTimeBalance(user.id);
      setUserTimeBalance(timeBalance);
      return timeBalance.amount_time_seconds || 0;
    } catch (error) {
      console.error('Erro ao carregar saldo de tempo:', error);
      return 0;
    }
  }, [user?.id]);

  // 4. Verificar status da tentativa atual
  const checkAttemptStatus = useCallback(async () => {
    if (!user?.id) return null;
    
    try {
      console.log('🎯 Verificando status da tentativa...');
      const activeAttempt = await apiService.getActiveAttempt(user.id);
      return activeAttempt;
    } catch (error) {
      console.error('Erro ao verificar tentativa:', error);
      return null;
    }
  }, [user?.id]);

  // 5. Criar nova tentativa
  const createAttempt = useCallback(async () => {
    if (!user?.id || !userTimeBalance) return null;
    
    try {
      console.log('🚀 Criando nova tentativa...');
      const newAttempt = await apiService.createAttempt(userTimeBalance.amount_time_seconds);
      setCurrentAttempt(newAttempt);
      setInitialTime(newAttempt.available_time_seconds);
      setTimeLeft(newAttempt.available_time_seconds);
      
      // Limpar mensagens antigas e definir mensagem inicial da nova tentativa
      setMessages([
        {
          id: "new-attempt-start",
          text: "Nova tentativa iniciada! Tente me convencer e ganhe o prêmio!",
          timestamp: new Date().toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          isBot: true
        }
      ]);
      
      setConvincementLevel(INITIAL_CONVINCEMENT);
      return newAttempt;
    } catch (error) {
      console.error('Erro ao criar tentativa:', error);
      return null;
    }
  }, [user?.id, userTimeBalance]);

  // 6. Atualizar status da tentativa
  const updateAttemptStatus = useCallback(async (status: string) => {
    if (!currentAttempt) {
      console.log('❌ Nenhuma tentativa ativa para atualizar');
      return;
    }
    
    try {
      console.log(`📝 Atualizando status da tentativa para: ${status}`);
      console.log(`📝 ID da tentativa: ${currentAttempt.id}`);
      console.log(`📝 Dados a serem enviados:`, { status });
      
      const result = await apiService.updateAttempt(currentAttempt.id, { status });
      console.log('✅ Status atualizado com sucesso:', result);
      
      setCurrentAttempt(prev => prev ? { ...prev, status } : null);
    } catch (error) {
      console.error('❌ Erro ao atualizar status da tentativa:', error);
    }
  }, [currentAttempt]);

  // 7. Bloquear/Desbloquear chat
  const blockChat = useCallback(() => {
    console.log('🔒 Bloqueando chat...');
    // Chat é bloqueado através do estado chatState
  }, []);

  const unlockChat = useCallback(() => {
    console.log('🔓 Desbloqueando chat...');
    // Chat é desbloqueado através do estado chatState
  }, []);

  // 8. Atualizar timer com novo valor
  const updateTimer = useCallback((newTimeBalance: number) => {
    console.log(`⏰ Atualizando timer com: ${newTimeBalance} segundos`);
    setTimeLeft(newTimeBalance);
    setInitialTime(newTimeBalance);
  }, []);

  // ==== SISTEMA DE TIMER ====
  
  // Estado para rastrear tempo local vs tempo sincronizado
  const [localTimeSpent, setLocalTimeSpent] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(Date.now());
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer local otimizado - sem requisições HTTP
  useEffect(() => {
    let interval = null;

    if (chatState === 'attempt_active' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            // Timer zerou - trigger do fluxograma
            handleTimerZero();
            return 0;
          }
          return time - 1;
        });

        // Incrementar tempo local gasto
        setLocalTimeSpent(spent => spent + 1);
      }, 1000);

      // Sincronização periódica (a cada 15 segundos)
      syncIntervalRef.current = setInterval(async () => {
        await syncTimeWithServer();
      }, 15000);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [chatState, timeLeft]);

  // Função para sincronizar tempo com servidor
  const syncTimeWithServer = useCallback(async () => {
    if (!user?.id || localTimeSpent <= 0) return;

    try {
      console.log(`🔄 Sincronizando ${localTimeSpent}s com servidor...`);
      
      await apiService.updateTimeBalance(user.id, localTimeSpent);
      
      // Reset do contador local após sincronização
      setLocalTimeSpent(0);
      setLastSyncTime(Date.now());
      
      console.log(`✅ Sincronização concluída`);
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      // Manter localTimeSpent para tentar novamente na próxima sincronização
    }
  }, [user?.id, localTimeSpent]);

  // Sincronização final ao sair da página ou mudar estado
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (localTimeSpent > 0 && user?.id) {
        // Sincronização síncrona ao sair da página usando sendBeacon
        const url = `http://localhost:3001/api/time-balance/${user.id}`;
        const data = new Blob([JSON.stringify({ seconds_to_subtract: localTimeSpent })], {
          type: 'application/json'
        });
        navigator.sendBeacon(url, data);
        console.log(`📡 SendBeacon: ${localTimeSpent}s enviados`);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Sincronizar ao desmontar componente
      if (localTimeSpent > 0) {
        syncTimeWithServer();
      }
    };
  }, [localTimeSpent, user?.id, syncTimeWithServer]);

  // Efeito para piscar quando tempo <= 10 segundos
  useEffect(() => {
    let blinkInterval = null;

    if (timeLeft <= 10 && timeLeft > 0 && chatState === 'attempt_active') {
      blinkInterval = setInterval(() => {
        setIsBlinking(prev => !prev);
      }, 500);
    } else {
      setIsBlinking(false);
    }

    return () => {
      if (blinkInterval) clearInterval(blinkInterval);
    };
  }, [timeLeft, chatState]);

  // ==== HANDLERS DO FLUXOGRAMA ====

  // Trigger acionado quando timer zera
  const handleTimerZero = useCallback(async () => {
    console.log('⏰ TRIGGER: Timer zerou!');
    
    // Sincronizar tempo pendente antes de verificar saldo
    await syncTimeWithServer();
    
    // Verificar saldo de tempo do usuário (buscar dados atualizados)
    const remainingBalance = await checkUserTimeBalance();
    
    if (remainingBalance > 0) {
      // Se usuário possui saldo de tempo: atualizar timer
      console.log('✅ Usuário ainda tem saldo, atualizando timer...');
      updateTimer(remainingBalance);
    } else {
      // Se usuário não tem saldo: verificar status da tentativa
      console.log('❌ Usuário sem saldo, verificando tentativa...');
      
      if (currentAttempt?.status === 'active') {
        // Mudar status para "expired"
        await updateAttemptStatus('expired');
        
        // Limpar tentativa atual
        setCurrentAttempt(null);
        
        // Desconectar WebSocket
        disconnectWebSocket();
        
        // Atualizar estado para mostrar botão de comprar mais tempo
        setChatState('user_authenticated_no_balance');
        blockChat();
        
        console.log('✅ Tentativa expirada, exibindo botão para comprar mais tempo');
      }
    }
  }, [syncTimeWithServer, checkUserTimeBalance, updateTimer, currentAttempt, updateAttemptStatus, blockChat]);

  // Handler para botão "Parar tentativa"
  const handleStopAttempt = useCallback(async () => {
    console.log('🛑 Usuário parou a tentativa');
    
    if (currentAttempt?.status === 'active') {
      console.log('📝 Tentativa ativa encontrada, atualizando para abandoned...');
      await updateAttemptStatus('abandoned');
      
      // Limpar tentativa atual
      setCurrentAttempt(null);
      
      // Desconectar WebSocket
      disconnectWebSocket();
      
      // Verificar saldo para definir estado correto
      const timeBalance = await checkUserTimeBalance();
      
      if (timeBalance > 0) {
        setChatState('user_authenticated_has_balance');
      } else {
        setChatState('user_authenticated_no_balance');
      }
      
      blockChat();
      
      // Limpar timer
      setTimeLeft(0);
      
      console.log('✅ Tentativa abandonada, exibindo botões apropriados');
    } else {
      console.log('⚠️ Nenhuma tentativa ativa para parar');
    }
  }, [currentAttempt, updateAttemptStatus, blockChat, checkUserTimeBalance]);

  // Handler para botão "Desbloquear chat" (usuário não autenticado)
  const handleUnlockChat = useCallback(async () => {
    console.log('🔓 Processando desbloqueio do chat...');
    setIsLoading(true);

    try {
      // 1. Verificar se usuário está autenticado
      const authenticated = checkUserAuthentication();
      
      if (!authenticated) {
        // Usuário não autenticado - abrir checkout para autenticação
        console.log('❌ Usuário não autenticado, abrindo checkout...');
        setShowPaymentDialog(true);
        return;
      }

      // 2. Verificar saldo de tempo
      const timeBalance = await checkUserTimeBalance();
      
      if (timeBalance <= 0) {
        // Usuário sem saldo - abrir checkout para compra
        console.log('💰 Usuário sem saldo, abrindo checkout...');
        setChatState('user_authenticated_no_balance');
        setShowPaymentDialog(true);
        return;
      }

      // 3. Se chegou aqui, usuário está autenticado e tem saldo
      // Redirecionar para função de iniciar tentativa
      await handleStartAttempt();
    } catch (error) {
      console.error('Erro no processo de desbloqueio:', error);
      setShowPaymentDialog(true);
    } finally {
      setIsLoading(false);
    }
  }, [checkUserAuthentication, checkUserTimeBalance]);

  // Handler específico para "Iniciar tentativa" (usuário autenticado com saldo)
  const handleStartAttempt = useCallback(async () => {
    console.log('🚀 Iniciando nova tentativa...');
    setIsLoading(true);

    try {
      // Verificar se já existe tentativa ativa
      const existingAttempt = await checkAttemptStatus();
      
      if (existingAttempt && existingAttempt.status === 'active') {
        // Continuar tentativa existente
        console.log('🔄 Continuando tentativa existente...');
        
        // Obter saldo real do usuário
        const currentTimeBalance = await checkUserTimeBalance();
        
        setCurrentAttempt(existingAttempt);
        // CORREÇÃO: Usar saldo real do usuário, não o tempo inicial da tentativa
        setTimeLeft(currentTimeBalance);
        setInitialTime(existingAttempt.available_time_seconds);
        setConvincementLevel(existingAttempt.convincing_score);
        setChatState('attempt_active');
        
        // Conectar WebSocket para receber atualizações em tempo real
        connectWebSocket(existingAttempt.id);
        
        // Carregar mensagens da tentativa existente
        await loadAttemptMessages(existingAttempt.id);
      } else {
        // Criar nova tentativa
        const newAttempt = await createAttempt();
        if (newAttempt) {
          console.log('✅ Nova tentativa criada com sucesso!');
          setChatState('attempt_active');
          
          // Conectar WebSocket para receber atualizações em tempo real
          connectWebSocket(newAttempt.id);
        } else {
          console.error('❌ Falha ao criar tentativa');
        }
      }
    } catch (error) {
      console.error('Erro ao iniciar tentativa:', error);
    } finally {
      setIsLoading(false);
    }
  }, [checkAttemptStatus, createAttempt, checkUserTimeBalance, loadAttemptMessages]);

  // ==== DEFINIR ESTADO INICIAL ====
  
  useEffect(() => {
    const initializeAppState = async () => {
      console.log('🚀 Inicializando estado da aplicação...');
      
      // Verificar autenticação
      const authenticated = checkUserAuthentication();
      
      if (!authenticated) {
        setChatState('user_not_authenticated');
        return;
      }

      // Verificar saldo de tempo
      const timeBalance = await checkUserTimeBalance();
      
      if (timeBalance <= 0) {
        setChatState('user_authenticated_no_balance');
        return;
      }

      // Verificar tentativa ativa
      const attempt = await checkAttemptStatus();
      
      if (attempt && attempt.status === 'active') {
        setCurrentAttempt(attempt);
        // CORREÇÃO: Usar saldo real do usuário, não o tempo inicial da tentativa
        setTimeLeft(timeBalance);
        setInitialTime(attempt.available_time_seconds);
        setConvincementLevel(attempt.convincing_score);
        setChatState('attempt_active');
        
        // Conectar WebSocket para receber atualizações em tempo real
        connectWebSocket(attempt.id);
        
        // Carregar mensagens da tentativa existente
        await loadAttemptMessages(attempt.id);
      } else {
        setChatState('user_authenticated_has_balance');
      }
    };

    initializeAppState();
  }, [checkUserAuthentication, checkUserTimeBalance, checkAttemptStatus, loadAttemptMessages]);

  // ==== ANÁLISE DE ARGUMENTOS E ENVIO DE MENSAGEM ====
  
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

  const updateConvincementLevel = useCallback((change) => {
    setIsConvincementAnimating(true);

    setTimeout(() => {
      setConvincementLevel(prev => Math.max(0, Math.min(100, prev + change)));
      setTimeout(() => setIsConvincementAnimating(false), 500);
    }, 200);
  }, []);

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
    if (!inputText.trim() || chatState !== 'attempt_active' || !currentAttempt) return;

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
          const convincementChange = analyzeArgument(messageText);
          const newLevel = Math.max(0, Math.min(100, convincementLevel + convincementChange));
          updateConvincementLevel(convincementChange);

          // Atualizar score da tentativa
          await apiService.updateAttempt(currentAttempt.id, { convincing_score: newLevel });

          const botResponseText = generateBotResponse(convincementChange, newLevel);

          // Gerar resposta da AI através da API
          // A resposta será adicionada automaticamente via realtime WebSocket
          await apiService.createAIResponse(
            currentAttempt.id, 
            savedMessage.id, 
            botResponseText,
            newLevel
          );

          // Verificar se usuário ganhou (score >= 90)
          if (newLevel >= 90) {
            await updateAttemptStatus('completed');
            
            // Desconectar WebSocket
            disconnectWebSocket();
            
            setChatState('user_authenticated_has_balance');
            // Aqui poderia mostrar tela de prêmio
          }
        } catch (error) {
          console.error('Erro ao gerar resposta da AI:', error);
        }
      }, 1000);

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  }, [inputText, chatState, currentAttempt, analyzeArgument, updateConvincementLevel, convincementLevel, generateBotResponse, updateAttemptStatus]);

  // ==== HANDLERS DE UI ====
  
  const handlePaymentSuccess = useCallback(async () => {
    setShowPaymentDialog(false);
    // Recarregar saldo após pagamento bem-sucedido
    await checkUserTimeBalance();
    // Definir estado baseado no novo saldo
    setChatState('user_authenticated_has_balance');
  }, [checkUserTimeBalance]);

  const handleClosePayment = useCallback(() => {
    setShowPaymentDialog(false);
  }, []);

  // Função para navegar para o histórico ao clicar no email
  const handleEmailClick = useCallback(() => {
    console.log('Navegando para histórico de tentativas...');
    navigate('/history');
  }, [navigate]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey && chatState === 'attempt_active') {
      e.preventDefault();
      handleSendMessage();
    }
  }, [chatState, handleSendMessage]);

  // Scroll automático
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ==== RENDERIZAÇÃO BASEADA NO ESTADO ====
  
  const renderMainButton = () => {
    switch (chatState) {
      case 'user_not_authenticated':
        return (
          <button
            onClick={handleUnlockChat}
            disabled={isLoading}
            className="w-full bg-violet-400 hover:bg-violet-300 disabled:bg-violet-400/70 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 text-lg flex items-center justify-center space-x-2"
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
        );

      case 'user_authenticated_no_balance':
      case 'attempt_expired':
      case 'attempt_abandoned':
        return (
          <button
            onClick={() => setShowPaymentDialog(true)}
            className="w-full bg-violet-400 hover:bg-violet-300 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 text-lg flex items-center justify-center space-x-2"
          >
            <Clock className="w-5 h-5" />
            <span>Adicionar tempo para tentar</span>
          </button>
        );

      case 'user_authenticated_has_balance':
        return (
          <div className="space-y-3">
            <button
              onClick={handleStartAttempt}
              disabled={isLoading}
              className="w-full bg-violet-400 hover:bg-violet-300 disabled:bg-violet-400/70 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 text-lg flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Iniciando...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>Iniciar tentativa</span>
                </>
              )}
            </button>
            <button
              onClick={() => setShowPaymentDialog(true)}
              className="w-full bg-slate-600 hover:bg-slate-500 text-white font-medium py-3 px-6 rounded-2xl transition-all duration-300 text-base flex items-center justify-center space-x-2"
            >
              <Clock className="w-4 h-4" />
              <span>Adicionar tempo para tentar</span>
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  const isChatBlocked = chatState !== 'attempt_active';

  return (
    <div className="flex flex-col h-full bg-slate-800 text-white w-full border-l border-slate-700">
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
          <div className="flex items-center space-x-2">
            <button
              onClick={handleEmailClick}
              className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 transition-colors duration-200"
              title="Ver histórico de tentativas"
            >
              <History className="w-5 h-5 text-purple-400" />
            </button>
            <button
              onClick={onShowPrize}
              className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 transition-colors duration-200"
              title="Ver prêmios disponíveis"
            >
              <Trophy className="w-5 h-5 text-purple-400" />
            </button>
          </div>
        </div>

        <ConvincementMeter 
          level={convincementLevel} 
          isAnimating={isConvincementAnimating} 
        />

        <Timer 
          timeLeft={timeLeft}
          isActive={chatState === 'attempt_active'}
          isBlinking={isBlinking}
          onStopAttempt={handleStopAttempt}
          totalTime={initialTime}
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
        {isChatBlocked ? (
          <>
            {renderMainButton()}
            
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
                onClick={handleEmailClick}
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