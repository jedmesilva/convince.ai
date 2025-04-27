import { createClient } from '@supabase/supabase-js';

// Carregar variáveis de ambiente
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL deve estar definido nas variáveis de ambiente");
}

if (!supabaseAnonKey) {
  console.warn("SUPABASE_ANON_KEY não está definido. Algumas operações anônimas podem falhar.");
}

if (!supabaseServiceRoleKey) {
  console.warn("SUPABASE_SERVICE_ROLE_KEY não está definido. Operações administrativas podem falhar.");
}

// Cliente Supabase com chave anônima (para operações limitadas)
export const supabaseAnon = createClient(
  supabaseUrl, 
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: false,
    }
  }
);

// Cliente Supabase com chave de serviço (para operações administrativas)
export const supabaseAdmin = createClient(
  supabaseUrl, 
  supabaseServiceRoleKey || '',
  {
    auth: {
      persistSession: false,
    }
  }
);

// Função utilitária para selecionar o cliente apropriado
export function getSupabase(useAdmin = false) {
  return useAdmin ? supabaseAdmin : supabaseAnon;
}