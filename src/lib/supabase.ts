import { createClient } from '@supabase/supabase-js';

// Usar as variáveis de ambiente específicas para o frontend (com prefixo VITE_)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("VITE_SUPABASE_URL não está definido");
}

if (!supabaseAnonKey) {
  console.warn("VITE_SUPABASE_ANON_KEY não está definido. Algumas operações podem falhar.");
}

// Criar e exportar o cliente Supabase
export const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey || '',
);

// Funções utilitárias para interação com o Supabase

// Função para buscar o total do prêmio atual
export async function fetchPrizeAmount() {
  try {
    const { data, error } = await supabase
      .from('prize_pools')
      .select('amount')
      .order('id', { ascending: true })
      .limit(1)
      .single();
      
    if (error) throw error;
    return data.amount;
  } catch (error) {
    console.error("Erro ao buscar valor do prêmio:", error);
    return 5000; // Valor default
  }
}

// Função para buscar o número de tentativas falhas
export async function fetchFailedAttemptsCount() {
  try {
    const { count, error } = await supabase
      .from('persuasion_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed');
      
    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error("Erro ao buscar número de tentativas falhas:", error);
    return 0;
  }
}

// Função para buscar mensagens por ID de sessão
export async function fetchMessagesBySessionId(sessionId: string) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });
      
    if (error) throw error;
    
    return data.map(msg => ({
      id: msg.id,
      text: msg.text,
      sender: msg.is_user ? 'user' : 'ai',
      timestamp: new Date(msg.timestamp)
    }));
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    return [];
  }
}

// Função para criar uma nova mensagem
export async function createMessage(text: string, isUser: boolean, sessionId: string) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        text,
        is_user: isUser,
        session_id: sessionId,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      id: data.id,
      text: data.text,
      sender: data.is_user ? 'user' : 'ai',
      timestamp: new Date(data.timestamp)
    };
  } catch (error) {
    console.error("Erro ao criar mensagem:", error);
    throw error;
  }
}

// Função para buscar o nível de convencimento mais recente
export async function fetchLatestConvincingLevel(sessionId: string) {
  try {
    // Primeiro, buscar a tentativa mais recente para esta sessão
    const { data: attempts, error: attemptError } = await supabase
      .from('persuasion_attempts')
      .select('id')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (attemptError || !attempts.length) return 0;
    
    const attemptId = attempts[0].id;
    
    // Agora, buscar o nível mais recente para esta tentativa
    const { data, error } = await supabase
      .from('convincing_levels')
      .select('level')
      .eq('attempt_id', attemptId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
      
    if (error) {
      // Se não existir, retorna 0
      if (error.code === 'PGRST116') return 0;
      throw error;
    }
    
    return data.level;
  } catch (error) {
    console.error("Erro ao buscar nível de convencimento:", error);
    return 0;
  }
}

// Função para enviar uma solicitação de pagamento (simulação)
export async function createPayment(sessionId: string, amount: number) {
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        session_id: sessionId,
        amount,
        status: 'successful',
        timestamp: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      id: data.id,
      amount: data.amount,
      status: data.status,
      timestamp: new Date(data.timestamp)
    };
  } catch (error) {
    console.error("Erro ao processar pagamento:", error);
    throw error;
  }
}

// Função para solicitar saque do prêmio
export async function withdrawPrize(sessionId: string, method: string) {
  try {
    const { data, error } = await supabase.rpc('withdraw_prize', {
      p_session_id: sessionId,
      p_method: method
    });
    
    if (error) throw error;
    
    return {
      success: true,
      withdrawal: data
    };
  } catch (error) {
    console.error("Erro ao processar saque:", error);
    throw error;
  }
}