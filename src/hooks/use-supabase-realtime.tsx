import { useEffect, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Hook genérico para inscrições em tempo real
export function useSupabaseRealtime<T>(
  tableName: string,
  column: string,
  value: string | number,
  initialData: T[] = []
): {
  data: T[];
  loading: boolean;
  error: Error | null;
} {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    setLoading(true);

    // Função para carregar dados iniciais
    const fetchInitialData = async () => {
      try {
        // Consulta com filtro
        const { data: initialData, error } = await supabase
          .from(tableName)
          .select('*')
          .eq(column, value)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setData(initialData || []);
        setLoading(false);
      } catch (error) {
        console.error(`Erro ao buscar dados de ${tableName}:`, error);
        setError(error instanceof Error ? error : new Error(String(error)));
        setLoading(false);
      }
    };

    // Inscrever-se em mudanças em tempo real
    const setupRealtimeSubscription = () => {
      const channel = supabase
        .channel(`${tableName}_changes`)
        .on(
          'postgres_changes',
          {
            event: '*', // Escutar inserções, atualizações e exclusões
            schema: 'public',
            table: tableName,
            filter: `${column}=eq.${value}`,
          },
          (payload) => {
            console.log(`Mudança em tempo real em ${tableName}:`, payload);
            
            // Atualizar os dados com base no tipo de evento
            if (payload.eventType === 'INSERT') {
              setData((current) => [payload.new as T, ...current]);
            } else if (payload.eventType === 'UPDATE') {
              setData((current) =>
                current.map((item: any) => 
                  item.id === (payload.new as any).id ? (payload.new as T) : item
                )
              );
            } else if (payload.eventType === 'DELETE') {
              setData((current) =>
                current.filter((item: any) => item.id !== (payload.old as any).id)
              );
            }
          }
        )
        .subscribe((status) => {
          console.log(`Status da inscrição em ${tableName}:`, status);
          if (status === 'SUBSCRIBED') {
            console.log(`Inscrito com sucesso em ${tableName}`);
          }
        });

      setChannel(channel);
      return channel;
    };

    // Carregar dados iniciais e configurar inscrição
    fetchInitialData();
    const channel = setupRealtimeSubscription();

    // Limpar inscrição quando o componente for desmontado
    return () => {
      if (channel) {
        console.log(`Cancelando inscrição em ${tableName}`);
        supabase.removeChannel(channel);
      }
    };
  }, [tableName, column, value]);

  return { data, loading, error };
}

// Hook específico para tentativas de persuasão
export function usePersuasionAttempts(sessionId: string) {
  return useSupabaseRealtime<any>(
    'persuasion_attempts',
    'session_id',
    sessionId
  );
}

// Hook específico para mensagens
export function useMessages(sessionId: string) {
  return useSupabaseRealtime<any>(
    'messages',
    'session_id',
    sessionId
  );
}

// Hook específico para níveis de convencimento
export function useConvincingLevels(attemptId: number) {
  const result = useSupabaseRealtime<any>(
    'convincing_levels',
    'attempt_id',
    attemptId
  );
  return result;
}

// Hook específico para obter todas as tentativas recentes (sem filtro)
export function useRecentAttempts(limit: number = 10) {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    setLoading(true);

    // Função para carregar dados iniciais
    const fetchInitialData = async () => {
      try {
        // Consulta sem filtro, apenas com limite e ordenação
        // Como temos problema com a relação entre tabelas, vamos buscar apenas os dados da tabela principal
        const { data: initialData, error } = await supabase
          .from('persuasion_attempts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;

        // Para cada tentativa, simulamos um username (não temos acesso ao join devido ao erro de relação)
        const attemptsList = initialData?.map(attempt => ({
          ...attempt,
          // Criamos um username aleatório baseado no session_id para demonstração
          users: { 
            username: `Usuário ${attempt.session_id.substring(0, 4)}`
          }
        })) || [];

        setAttempts(attemptsList);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar tentativas recentes:', error);
        setError(error instanceof Error ? error : new Error(String(error)));
        setLoading(false);
      }
    };

    // Inscrever-se em mudanças em tempo real
    const setupRealtimeSubscription = () => {
      const channel = supabase
        .channel('recent_attempts_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'persuasion_attempts',
          },
          async (payload) => {
            console.log('Nova tentativa adicionada:', payload);
            
            try {
              // Como temos problema com a relação, usamos diretamente os dados do payload
              const newAttempt = {
                ...(payload.new as any),
                // Criamos um username para demonstração
                users: { 
                  username: `Usuário ${(payload.new as any).session_id.substring(0, 4)}`
                }
              };
              
              // Adicionar nova tentativa ao início e manter apenas o limite especificado
              setAttempts((current) => [newAttempt, ...current.slice(0, limit - 1)]);
            } catch (error) {
              console.error('Erro ao processar nova tentativa:', error);
            }
          }
        )
        .subscribe((status) => {
          console.log('Status da inscrição em tentativas recentes:', status);
        });

      setChannel(channel);
      return channel;
    };

    // Carregar dados iniciais e configurar inscrição
    fetchInitialData();
    const channel = setupRealtimeSubscription();

    // Limpar inscrição quando o componente for desmontado
    return () => {
      if (channel) {
        console.log('Cancelando inscrição em tentativas recentes');
        supabase.removeChannel(channel);
      }
    };
  }, [limit]);

  return { attempts, loading, error };
}