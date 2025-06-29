-- Script SQL para configurar todas as tabelas no Supabase
-- Execute este script no SQL Editor do painel do Supabase

-- 1. Tabela convincers (usuários)
CREATE TABLE IF NOT EXISTS convincers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);

-- 2. Tabela attempts (tentativas de persuasão)
CREATE TABLE IF NOT EXISTS attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  convincer_id UUID NOT NULL REFERENCES convincers(id),
  status TEXT DEFAULT 'active' NOT NULL,
  available_time_seconds INTEGER DEFAULT 1800 NOT NULL,
  convincing_score INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);

-- 3. Tabela messages (mensagens dos usuários)
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES attempts(id),
  convincer_id UUID NOT NULL REFERENCES convincers(id),
  message TEXT NOT NULL,
  convincing_score_snapshot INTEGER DEFAULT 0 NOT NULL,
  status TEXT DEFAULT 'sent' NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);

-- 4. Tabela ai_responses (respostas da IA)
CREATE TABLE IF NOT EXISTS ai_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES attempts(id),
  user_message_id UUID NOT NULL REFERENCES messages(id),
  ai_response TEXT NOT NULL,
  convincing_score_snapshot INTEGER DEFAULT 0 NOT NULL,
  status TEXT DEFAULT 'sent' NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);

-- 5. Tabela payments (pagamentos)
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  convincer_id UUID NOT NULL REFERENCES convincers(id),
  amount_paid NUMERIC(10, 2) NOT NULL,
  time_purchased_seconds INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);

-- 6. Tabela time_balances (saldo de tempo)
CREATE TABLE IF NOT EXISTS time_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  convincer_id UUID NOT NULL REFERENCES convincers(id),
  payment_id UUID NOT NULL REFERENCES payments(id),
  amount_time_seconds INTEGER NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);

-- 7. Tabela prizes (prêmios)
CREATE TABLE IF NOT EXISTS prizes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  amount NUMERIC(10, 2) NOT NULL,
  distributed_at TIMESTAMP,
  winner_convincer_id UUID REFERENCES convincers(id),
  status TEXT DEFAULT 'open' NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);

-- 8. Tabela prize_certificates (certificados de prêmio)
CREATE TABLE IF NOT EXISTS prize_certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  convincer_id UUID NOT NULL REFERENCES convincers(id),
  prize_id UUID NOT NULL REFERENCES prizes(id),
  hash TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);

-- 9. Tabela withdrawals (saques)
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  convincer_id UUID NOT NULL REFERENCES convincers(id),
  prize_id UUID NOT NULL REFERENCES prizes(id),
  certificate_id UUID NOT NULL REFERENCES prize_certificates(id),
  hash TEXT NOT NULL UNIQUE,
  amount_withdrawn NUMERIC(10, 2) NOT NULL,
  requested_at TIMESTAMP DEFAULT now() NOT NULL,
  completed_at TIMESTAMP,
  status TEXT DEFAULT 'pending' NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Inserir prêmio inicial
INSERT INTO prizes (amount, status) 
VALUES (100.00, 'open')
ON CONFLICT DO NOTHING;

-- Inserir alguns dados de exemplo para demonstração
INSERT INTO convincers (name, email, status)
VALUES 
  ('João Silva', 'joao@exemplo.com', 'active'),
  ('Maria Santos', 'maria@exemplo.com', 'active'),
  ('Pedro Costa', 'pedro@exemplo.com', 'active')
ON CONFLICT (email) DO NOTHING;