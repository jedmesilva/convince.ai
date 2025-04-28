import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useRecentAttempts } from '@/hooks/use-supabase-realtime';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Interface para cada tentativa
interface Attempt {
  id: number;
  name: string;
  timestamp: Date;
}

// Lista de nomes para tentativas anônimas (quando não há usuário autenticado)
const randomNames = [
  "Miguel", "Sophia", "Arthur", "Helena", "Bernardo", 
  "Valentina", "Heitor", "Laura", "Davi", "Isabella", 
  "Lorenzo", "Manuela", "Théo", "Júlia", "Gabriel", 
  "Alice", "Pedro", "Giovanna", "Benjamin", "Beatriz",
  "Lucas", "Maria", "João", "Ana", "Carlos",
  "Mariana", "Ricardo", "Fernanda", "Diego", "Camila"
];

// Componente de carregamento
const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-8">
    <Loader2 className="h-6 w-6 animate-spin text-theme-purple" />
    <span className="ml-2 text-theme-light-purple">Carregando tentativas...</span>
  </div>
);

const AttemptsList: React.FC = () => {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Contador para o número de tentativas total
  const [attemptCount, setAttemptCount] = useState<number>(0);
  
  // Buscar tentativas recentes e contar total
  useEffect(() => {
    const fetchAttempts = async () => {
      setLoading(true);
      
      try {
        // Obter o número total de tentativas - se falhar, mantém como 0
        try {
          const { count, error } = await supabase
            .from('persuasion_attempts')
            .select('*', { count: 'exact', head: true });
          
          if (!error && count !== null) {
            setAttemptCount(count);
          }
        } catch (err) {
          console.error("Erro ao contar tentativas:", err);
          // Mantém o contador como 0
        }
        
        // Obter as 10 tentativas mais recentes - se falhar, a lista fica vazia
        try {
          const { data, error } = await supabase
            .from('persuasion_attempts')
            .select('id, created_at, session_id')
            .order('created_at', { ascending: false })
            .limit(10);
          
          if (!error && data && data.length > 0) {
            // Transformar os dados para o formato exigido
            const formattedAttempts: Attempt[] = data.map((attempt) => {
              // Usar nomes consistentes baseados na hash da session_id
              const sessionHash = hashCode(attempt.session_id);
              const nameIndex = Math.abs(sessionHash) % randomNames.length;
              
              return {
                id: attempt.id,
                name: randomNames[nameIndex],
                timestamp: new Date(attempt.created_at)
              };
            });
            
            setAttempts(formattedAttempts);
          }
        } catch (err) {
          console.error("Erro ao buscar tentativas:", err);
          // Lista permanece vazia
        }
      } catch (err: any) {
        console.error("Erro ao buscar tentativas:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };
    
    fetchAttempts();
    
    // Tenta configurar assinatura para atualizações em tempo real
    try {
      const channel = supabase
        .channel('public:persuasion_attempts')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'persuasion_attempts' },
          (payload) => {
            // Apenas incrementa o contador se a payload for válida
            if (payload && payload.new) {
              // Incrementa o contador
              setAttemptCount(prev => prev + 1);
              
              // Adiciona novo item apenas se tivermos dados válidos
              if (payload.new.id && payload.new.session_id && payload.new.created_at) {
                const newAttempt: Attempt = {
                  id: payload.new.id,
                  name: randomNames[Math.abs(hashCode(payload.new.session_id)) % randomNames.length],
                  timestamp: new Date(payload.new.created_at)
                };
                
                // Adiciona à lista mantendo no máximo 10 items
                setAttempts(prev => [newAttempt, ...prev.slice(0, 9)]);
              }
            }
          }
        )
        .subscribe((status) => {
          console.log("Status da inscrição em tentativas recentes:", status);
        });
      
      return () => {
        console.log("Cancelando inscrição em tentativas recentes");
        channel.unsubscribe();
      };
    } catch (err) {
      console.error("Erro ao configurar inscrição em tempo real:", err);
      return () => {}; // Nada para limpar
    }
  }, []);
  
  // Para garantir que os timestamps sejam atualizados a cada 30 segundos
  const [timeUpdate, setTimeUpdate] = useState(0);
  
  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimeUpdate(prev => prev + 1);
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Função simples para gerar um hash de uma string
  const hashCode = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  };
  
  // Função para formatar a mensagem com base no tempo decorrido
  const formatTimestamp = (timestamp: Date) => {
    try {
      if (!timestamp) return 'recentemente';
      
      const distance = formatDistanceToNow(timestamp, { 
        locale: pt,
        addSuffix: false 
      });
      
      if (distance.includes('segundo') || distance === 'menos de um minuto') {
        return 'agora mesmo';
      }
      
      return `há ${distance}`;
    } catch (error) {
      console.error('Erro ao formatar timestamp:', error);
      return 'recentemente';
    }
  };

  // Renderizar o loading state
  if (loading) {
    return <LoadingSpinner />;
  }

  // Renderizar mensagem de erro, se houver
  if (error) {
    return (
      <div className="mt-12 mb-12 max-w-xl mx-auto bg-theme-dark-purple bg-opacity-50 rounded-lg p-4 border border-red-500">
        <h3 className="text-red-400 text-center text-lg font-semibold mb-2">
          Erro ao carregar tentativas
        </h3>
        <p className="text-sm text-red-300 text-center">
          {error.message || 'Tente novamente mais tarde'}
        </p>
      </div>
    );
  }

  // Renderizar quando não há tentativas
  if (!attempts || attempts.length === 0) {
    return (
      <div className="mt-12 mb-12 max-w-xl mx-auto bg-theme-dark-purple bg-opacity-50 rounded-lg p-4 border border-theme-purple">
        <h3 className="text-theme-light-purple text-center text-lg font-semibold mb-2">
          Tentativas Recentes
        </h3>
        <p className="text-sm text-theme-light-purple text-center italic">
          Nenhuma tentativa registrada ainda
        </p>
      </div>
    );
  }

  return (
    <div className="mt-12 mb-12 max-w-xl mx-auto bg-theme-dark-purple bg-opacity-50 rounded-lg p-4 backdrop-blur-sm border border-theme-purple">
      <h3 className="text-theme-light-purple text-center text-lg font-semibold mb-3">
        Tentativas Recentes
      </h3>
      <div className="space-y-2">
        {attempts.map((attempt, index) => (
          <div 
            key={attempt.id}
            className={`p-3 rounded-lg transition-all duration-300 ${
              index === 0 
                ? 'bg-theme-purple bg-opacity-30 border-l-4 border-theme-vivid-purple animate-pulse-slow' 
                : 'bg-theme-dark-bg bg-opacity-60 hover:bg-opacity-80 border-l-4 border-theme-purple border-opacity-40'
            }`}
          >
            <div className="text-sm flex items-center">
              <span className="mr-2 text-theme-bright-purple font-bold flex items-center justify-center min-w-[35px]">
                {attemptCount - index}°
              </span>
              <span className="text-theme-light-purple font-medium">
                <strong className="text-theme-bright-purple">
                  {attempt.name}
                </strong> tentou {formatTimestamp(attempt.timestamp)}, mas fracassou!
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttemptsList;