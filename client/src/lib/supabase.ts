import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://puprczifqehzukossloc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('SUPABASE_URL e SUPABASE_ANON_KEY são necessários');
}

// Crear cliente Supabase para operações no frontend
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Hook personalizado para escutar mudanças em tempo real na tabela attempts
export const subscribeToAttemptChanges = (
  attemptId: string,
  onUpdate: (payload: any) => void
) => {
  const channel = supabase
    .channel(`attempt-${attemptId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'attempts',
        filter: `id=eq.${attemptId}`
      },
      (payload) => {
        console.log('🔄 Atualização em tempo real da tentativa:', payload);
        onUpdate(payload);
      }
    )
    .subscribe();

  return () => {
    console.log('🔌 Desconectando do realtime da tentativa:', attemptId);
    supabase.removeChannel(channel);
  };
};

// Hook para escutar todas as mudanças na tabela attempts (opcional)
export const subscribeToAllAttemptChanges = (
  onUpdate: (payload: any) => void
) => {
  const channel = supabase
    .channel('all-attempts')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'attempts'
      },
      (payload) => {
        console.log('🔄 Atualização em tempo real (todas tentativas):', payload);
        onUpdate(payload);
      }
    )
    .subscribe();

  return () => {
    console.log('🔌 Desconectando do realtime (todas tentativas)');
    supabase.removeChannel(channel);
  };
};