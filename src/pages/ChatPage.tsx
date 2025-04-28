import React, { useState, useEffect } from 'react';
import RealtimeChat from '@/components/RealtimeChat';
import AttemptsList from '@/components/AttemptsList';
import AiAvatar from '@/components/AiAvatar';
import PrizeDisplay from '@/components/PrizeDisplay';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

const ChatPage: React.FC = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [persuasionLevel, setPersuasionLevel] = useState(0);
  const [sessionId] = useState<string>(() => {
    // Tentar obter o session ID existente do localStorage ou criar um novo
    const savedSessionId = localStorage.getItem('chat_session_id');
    if (savedSessionId) return savedSessionId;
    
    const newSessionId = uuidv4();
    localStorage.setItem('chat_session_id', newSessionId);
    return newSessionId;
  });

  // Iniciar uma conexão WebSocket para atualizações em tempo real
  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
    
    try {
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log('WebSocket conectado');
        // Registrar esta conexão com o ID da sessão
        socket.send(JSON.stringify({
          type: 'register',
          sessionId: sessionId
        }));
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'persuasionUpdate') {
            console.log('Atualização do nível de persuasão:', data.level);
            setPersuasionLevel(data.level);
          }
        } catch (error) {
          console.error('Erro ao processar mensagem WebSocket:', error);
        }
      };
      
      socket.onerror = (error) => {
        console.error('Erro WebSocket:', error);
      };
      
      socket.onclose = () => {
        console.log('WebSocket desconectado');
      };
      
      // Limpar conexão quando o componente for desmontado
      return () => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      };
    } catch (error) {
      console.error('Erro ao configurar WebSocket:', error);
    }
  }, [sessionId]);

  // Função para lidar com a resposta da IA
  const handleAiResponse = (response: string) => {
    console.log('Resposta da IA:', response);
    
    // Desbloquear chat com base na resposta da IA
    if (response === 'Pagamento concluído') {
      setIsUnlocked(true);
    } else if (response === 'timer_ended') {
      setIsUnlocked(false);
    }
  };

  // Função para atualizar o nível de persuasão
  const handlePersuasionChange = (level: number) => {
    setPersuasionLevel(level);
  };

  // Atualizar o título da página com o nível de persuasão
  useEffect(() => {
    document.title = `Convença a IA - ${persuasionLevel}% persuasivo`;
  }, [persuasionLevel]);

  return (
    <div className="min-h-screen bg-theme-dark-bg overflow-x-hidden">
      {/* Fundo gradiente */}
      <div className="absolute inset-0 bg-gradient-to-b from-theme-dark-purple/20 to-transparent pointer-events-none"></div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Cabeçalho */}
          <header className="text-center mb-8">
            <h1 className="text-theme-bright-purple text-4xl font-bold mb-2">
              Convença a IA
            </h1>
            <p className="text-theme-light-purple text-lg max-w-2xl mx-auto">
              540 pessoas já tentaram e falharam. Você consegue convencer a IA a lhe dar o prêmio?
            </p>
          </header>

          {/* Grade principal com duas colunas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coluna 1: Lista de tentativas */}
            <div className="lg:col-span-1">
              <AttemptsList />
            </div>
            
            {/* Coluna 2: Avatar da IA e indicador de progresso */}
            <div className="lg:col-span-2 flex flex-col items-center">
              <AiAvatar persuasionLevel={persuasionLevel} />
              
              {/* Barra de progresso de persuasão */}
              <div className="w-full max-w-md mt-8 mb-12">
                <div className="bg-theme-dark-purple bg-opacity-50 rounded-full h-4 relative overflow-hidden border border-theme-purple">
                  <div 
                    className="bg-gradient-to-r from-theme-purple to-theme-vivid-purple h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${persuasionLevel}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-theme-light-purple">Não convencida</span>
                  <span className="text-theme-bright-purple font-bold">{persuasionLevel}%</span>
                  <span className="text-theme-light-purple">Convencida</span>
                </div>
              </div>
              
              {/* Exibição do prêmio atual */}
              <PrizeDisplay initialPrizeAmount={10000} initialFailedAttempts={540} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Chat em tempo real fixado na parte inferior */}
      <RealtimeChat 
        isUnlocked={isUnlocked}
        onAiResponse={handleAiResponse}
        onPersuasionChange={handlePersuasionChange}
      />
    </div>
  );
};

export default ChatPage;