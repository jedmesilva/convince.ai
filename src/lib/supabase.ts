import { createClient } from '@supabase/supabase-js';

// Verificar se as variáveis de ambiente estão definidas
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Variáveis de ambiente do Supabase não estão configuradas corretamente!');
}

// Criar cliente Supabase para o frontend
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Função para obter o token de sessão atual (útil para passar em requisições API)
export async function getAuthToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    return null;
  }
  return data.session.access_token;
}