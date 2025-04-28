CREATE TABLE IF NOT EXISTS prize_pools (
  id SERIAL PRIMARY KEY,
  amount REAL NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  email TEXT,
  status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS persuasion_attempts (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  session_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'failed'
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  is_user BOOLEAN NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  session_id TEXT NOT NULL, 
  attempt_id INTEGER REFERENCES persuasion_attempts(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  session_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL,
  method TEXT,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS persuasion_timers (
  id SERIAL PRIMARY KEY,
  attempt_id INTEGER REFERENCES persuasion_attempts(id),
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  duration_seconds INTEGER NOT NULL DEFAULT 300
);

CREATE TABLE IF NOT EXISTS convincing_levels (
  id SERIAL PRIMARY KEY,
  attempt_id INTEGER REFERENCES persuasion_attempts(id),
  level INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS withdrawals (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  method TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  session_id TEXT NOT NULL
);
