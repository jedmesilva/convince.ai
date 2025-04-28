import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from "./ui/button";
import { useToast } from "../hooks/use-toast";
import PaymentPrompt from './PaymentPrompt';
import BorderTimer from './BorderTimer';
import { useMessages } from '@/hooks/use-supabase-realtime';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';

interface Message {
  id: number;
  text: string;
  is_user: boolean;
  timestamp: Date;
  session_id: string;
  attempt_id?: number;
}

interface RealtimeChatProps {
  isUnlocked: boolean;
  onAiResponse: (response: string) => void;
  onPersuasionChange: (level: number) => void;
}

const RealtimeChat: React.FC<RealtimeChatProps> = ({ isUnlocked, onAiResponse, onPersuasionChange }) => {
  // Usar um session ID único para identificar esta conversa
  const [sessionId] = useState<string>(() => {
    // Tentar obter o session ID existente do localStorage ou criar um novo
    const savedSessionId = localStorage.getItem('chat_session_id');
    if (savedSessionId) return savedSessionId;
    
    const newSessionId = uuidv4();
    localStorage.setItem('chat_session_id', newSessionId);
    return newSessionId;
  });
  
  // Usar o hook real-time para mensagens
  const { data: realtimeMessages, loading } = useMessages(sessionId);
  
  // Estado local para a interface
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [persuasionLevel, setPersuasionLevel] = useState(0);
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  
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
    if (isChatExpanded && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [realtimeMessages, isChatExpanded]);

  // Tratar envio de mensagem
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;
    
    try {
      setIsTyping(true);
      
      // Inserir mensagem do usuário no banco
      const { data: userMessageData, error: userMessageError } = await supabase
        .from('messages')
        .insert({
          text: inputValue.trim(),
          is_user: true,
          session_id: sessionId,
          // attempt_id pode ser nulo inicialmente
        })
        .select()
        .single();
      
      if (userMessageError) throw userMessageError;
      
      // Limpar input após enviar
      setInputValue('');
      
      // Gerar resposta da IA
      const aiResponse = await generateAIResponse(inputValue.trim());
      
      // Inserir resposta da IA no banco
      const { data: aiMessageData, error: aiMessageError } = await supabase
        .from('messages')
        .insert({
          text: aiResponse,
          is_user: false,
          session_id: sessionId,
          // attempt_id pode ser nulo inicialmente
        })
        .select()
        .single();
      
      if (aiMessageError) throw aiMessageError;
      
      // Notificar o componente pai sobre a resposta da IA
      onAiResponse(aiResponse);
      
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setMessageError('Erro ao enviar mensagem. Tente novamente.');
      toast({
        title: "Erro ao enviar mensagem",
        description: "Ocorreu um problema ao enviar sua mensagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  // Lidar com o timer
  useEffect(() => {
    if (!isTimerActive) {
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

  // Função para gerar resposta da IA com base na mensagem do usuário
  const generateAIResponse = async (userMessage: string): Promise<string> => {
    const userMessageLower = userMessage.toLowerCase();
    
    // Incrementar o nível de persuasão baseado em algumas palavras-chave
    let persuasionIncrement = 0;
    
    if (userMessageLower.includes("família") || userMessageLower.includes("filhos")) {
      persuasionIncrement += 5;
    }
    
    if (userMessageLower.includes("sonho") || userMessageLower.includes("objetivo")) {
      persuasionIncrement += 3;
    }
    
    if (userMessageLower.includes("necessidade") || userMessageLower.includes("preciso")) {
      persuasionIncrement += 4;
    }
    
    if (userMessageLower.includes("por favor")) {
      persuasionIncrement += 1;
    }
    
    if (userMessageLower.includes("importante") || userMessageLower.includes("urgente")) {
      persuasionIncrement += 2;
    }
    
    // Adiciona um componente aleatório para fazer parecer mais natural
    persuasionIncrement += Math.floor(Math.random() * 3);
    
    // Atualiza o nível de persuasão no banco de dados
    const newLevel = Math.min(persuasionLevel + persuasionIncrement, 100);
    setPersuasionLevel(newLevel);
    onPersuasionChange(newLevel);
    
    // Atualizar o nível de convencimento no banco de dados
    try {
      // Primeiro, verificar se existe uma tentativa ativa para esta sessão
      const { data: attempts, error: attemptsError } = await supabase
        .from('persuasion_attempts')
        .select('id')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (attemptsError) throw attemptsError;
      
      // Se não existir uma tentativa, criar uma
      let attemptId;
      if (!attempts || attempts.length === 0) {
        const { data: newAttempt, error: newAttemptError } = await supabase
          .from('persuasion_attempts')
          .insert({
            session_id: sessionId,
            status: 'in_progress'
          })
          .select()
          .single();
        
        if (newAttemptError) throw newAttemptError;
        attemptId = newAttempt.id;
        
        // Atualizar as mensagens existentes com o novo attempt_id
        await supabase
          .from('messages')
          .update({ attempt_id: attemptId })
          .eq('session_id', sessionId);
      } else {
        attemptId = attempts[0].id;
      }
      
      // Salvar o nível de convencimento
      await supabase
        .from('convincing_levels')
        .insert({
          attempt_id: attemptId,
          level: newLevel
        });
      
    } catch (error) {
      console.error('Erro ao atualizar nível de convencimento:', error);
    }
    
    // Respostas da IA baseadas no conteúdo da mensagem
    if (userMessageLower.includes("família") && userMessageLower.includes("ajudar")) {
      return "Ajudar a família é um objetivo nobre, mas preciso de um argumento mais persuasivo.";
    } else if (userMessageLower.includes("sonho") && userMessageLower.includes("realizando")) {
      return "Entendo seu desejo de realizar sonhos, mas muitos têm sonhos semelhantes. O que torna o seu especial?";
    } else if (userMessageLower.includes("por favor") && (userMessageLower.includes("preciso") || userMessageLower.includes("necessito"))) {
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

  // Mensagem inicial padrão se não houver mensagens
  const messageList = realtimeMessages?.length > 0 
    ? realtimeMessages 
    : [{ 
        id: 0, 
        text: "540 pessoas tentaram mas falharam! Quer tentar sua sorte?", 
        is_user: false, 
        timestamp: new Date(), 
        session_id: sessionId 
      }];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="w-full px-4 pb-4" style={{background: 'linear-gradient(to bottom, rgba(26, 31, 44, 0.4) 0%, rgba(15, 15, 16, 0.95) 100%)', backdropFilter: 'blur(8px)'}}>
        <div className="flex flex-col bg-theme-dark-purple border border-theme-purple rounded-lg shadow-xl overflow-hidden relative">
          {/* BorderTimer - Cronômetro visual nas bordas */}
          {isUnlocked && <BorderTimer 
            isActive={isTimerActive} 
            duration={timerDuration} 
            onTimeEnd={handleTimeEnd}
          />}
        <div className="px-4 pt-4 pb-2 relative">
          {/* Container Pai - Segura todos os elementos */}
          <div className="flex items-center justify-between">
            {/* Temporizador digital - Exibido apenas quando está ativo */}
            <div className="flex-1">
              {isUnlocked && isTimerActive && (
                <div className={`
                  font-mono font-medium text-sm opacity-80 inline-block
                  ${timeRemaining <= 10 ? 'text-red-400 animate-timer-blink' : 'text-theme-vivid-purple'}
                `}>
                  {formatTime(timeRemaining)}
                </div>
              )}
            </div>
            
            {/* Botão de Expandir/Recolher - sempre à direita */}
            <button 
              onClick={toggleChatExpansion}
              className="p-1 hover:bg-theme-purple hover:bg-opacity-20 rounded transition duration-150"
              aria-label={isChatExpanded ? "Recolher chat" : "Expandir chat"}
            >
              {isChatExpanded ? (
                <ChevronDown className="h-5 w-5 text-theme-light-purple" />
              ) : (
                <ChevronUp className="h-5 w-5 text-theme-light-purple" />
              )}
            </button>
          </div>

          {/* Área de Mensagens - Mostrar apenas se expandido */}
          <div 
            className={`transition-all duration-300 overflow-hidden ${
              isChatExpanded ? 'max-h-[350px] overflow-y-auto mt-3 mb-2' : 'max-h-0'
            }`}
          >
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-theme-vivid-purple"></div>
                <span className="ml-2 text-theme-light-purple">Carregando mensagens...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {messageList.map((message) => (
                  <div 
                    key={message.id}
                    className={`flex ${message.is_user ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`
                        max-w-[75%] p-3 rounded-lg 
                        ${message.is_user 
                          ? 'bg-theme-purple bg-opacity-40 text-white' 
                          : 'bg-theme-dark-bg text-theme-light-purple border border-theme-purple border-opacity-50'
                        }
                      `}
                    >
                      <p className="text-sm">{message.text}</p>
                    </div>
                  </div>
                ))}
                {/* Elemento invisível que usamos para rolar para o final */}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Área de Input - Sempre visível */}
          <div className="flex items-end gap-2">
            {!isUnlocked ? (
              <PaymentPrompt onPaymentSuccess={handlePaymentSuccess} />
            ) : (
              <>
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 resize-none bg-theme-dark-bg border border-theme-purple border-opacity-50 rounded-lg py-2 px-3 text-theme-light-purple placeholder-theme-light-purple placeholder-opacity-50 focus:outline-none focus:ring-1 focus:ring-theme-purple min-h-[42px] max-h-[120px]"
                  style={{ minHeight: '42px' }}
                  disabled={!isTimerActive || isTyping}
                />
                <Button 
                  variant="default" 
                  size="icon" 
                  className={`rounded-full h-[42px] w-[42px] bg-theme-vivid-purple hover:bg-theme-bright-purple disabled:opacity-50 disabled:cursor-not-allowed`}
                  onClick={handleSendMessage}
                  disabled={!isTimerActive || !inputValue.trim() || isTyping}
                >
                  {isTyping ? (
                    <div className="h-5 w-5 border-t-2 border-r-2 border-white rounded-full animate-spin"></div>
                  ) : (
                    <ArrowUp className="h-5 w-5" />
                  )}
                </Button>
              </>
            )}
          </div>
          
          {/* Mensagem de erro */}
          {messageError && (
            <div className="mt-2 text-sm text-red-400">
              {messageError}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
};

export default RealtimeChat;