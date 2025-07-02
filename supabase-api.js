import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const app = express();
const PORT = 3001;

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS middleware DEVE vir ANTES do parsing
app.use(cors({
  origin: true,
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Additional CORS headers for preflight
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, Accept');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Parse different content types - DEPOIS do CORS
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  if (req.method === 'PATCH' && req.path.includes('/attempts/')) {
    console.log('PATCH request details:', {
      path: req.path,
      body: req.body,
      headers: req.headers
    });
  }
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    supabase: 'connected'
  });
});

// Prize statistics endpoint
app.get('/api/prizes/statistics', async (req, res) => {
  try {
    console.log('Fetching prize statistics...');

    // Get current prize
    const { data: currentPrize, error: currentError } = await supabase
      .from('prizes')
      .select('amount')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let currentPrizeAmount = 100;
    if (!currentError && currentPrize) {
      currentPrizeAmount = Number(currentPrize.amount);
    }

    // Get attempt counts
    let totalAttempts = 0;
    let successfulAttempts = 0;

    try {
      const { count: attemptCount } = await supabase
        .from('attempts')
        .select('*', { count: 'exact', head: true });
      totalAttempts = attemptCount || 0;
    } catch (error) {
      console.log('Could not count attempts:', error.message);
    }

    try {
      const { count: successCount } = await supabase
        .from('attempts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('convincing_score', 95);
      successfulAttempts = successCount || 0;
    } catch (error) {
      console.log('Could not count successful attempts:', error.message);
    }

    const failedAttempts = Math.max(0, totalAttempts - successfulAttempts);
    const successRate = totalAttempts > 0 ? ((successfulAttempts / totalAttempts) * 100).toFixed(2) : '0.00';

    const result = {
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      currentPrizeAmount,
      successRate: `${successRate}%`
    };

    console.log('Prize statistics result:', result);
    res.json(result);
  } catch (error) {
    console.error('Prize statistics error:', error);
    // Return basic statistics
    res.json({
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      currentPrizeAmount: 100,
      successRate: '0.00%'
    });
  }
});

// Current prize endpoint
app.get('/api/prizes/current', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('prizes')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      // Create default prize
      const { data: newPrize, error: createError } = await supabase
        .from('prizes')
        .insert({
          amount: 100.00,
          status: 'open'
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating prize:', createError);
        return res.status(500).json({ error: 'Erro ao criar prêmio padrão' });
      }

      return res.json(newPrize);
    }

    res.json(data);
  } catch (error) {
    console.error('Current prize error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Get attempts
app.get('/api/attempts', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('attempts')
      .select(`
        id,
        status,
        convincing_score,
        created_at,
        convincers!inner(name)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching attempts:', error);
      return res.status(500).json({ error: 'Erro ao buscar tentativas' });
    }

    const transformedData = data.map(attempt => ({
      id: attempt.id,
      status: attempt.status,
      convincing_score: attempt.convincing_score,
      created_at: attempt.created_at,
      convincers: { name: attempt.convincers.name }
    }));

    res.json(transformedData);
  } catch (error) {
    console.error('Get attempts error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Create convincer
app.post('/api/convincers', async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }

    const { data, error } = await supabase
      .from('convincers')
      .insert({ name, email, status: 'active' })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Este email já está cadastrado' });
      }
      console.error('Error creating convincer:', error);
      return res.status(500).json({ error: 'Erro ao criar usuário' });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Create convincer error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Check if email exists
app.post('/api/auth/check-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    const { data, error } = await supabase
      .from('convincers')
      .select('id, email')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking email:', error);
      return res.status(500).json({ error: 'Erro ao verificar email' });
    }

    res.json({
      exists: !!data,
      user: data || null
    });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('Auth error:', authError);
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    // Get convincer data
    const { data: convincer, error: convincerError } = await supabase
      .from('convincers')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (convincerError) {
      console.error('Error fetching convincer:', convincerError);
      return res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
    }

    res.json({
      success: true,
      user: authData.user,
      convincer: convincer,
      session: authData.session
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Register user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        }
      }
    });

    if (authError) {
      console.error('Auth registration error:', authError);
      if (authError.message.includes('User already registered')) {
        return res.status(400).json({ error: 'Este email já está cadastrado' });
      }
      return res.status(400).json({ error: authError.message });
    }

    if (!authData.user) {
      return res.status(400).json({ error: 'Erro ao criar usuário' });
    }

    // The convincer record will be created automatically by the trigger
    // Wait a moment and then fetch the convincer data
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { data: convincer, error: convincerError } = await supabase
      .from('convincers')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (convincerError) {
      console.error('Error fetching new convincer:', convincerError);
      // Trigger might not have run yet, create manually
      const { data: newConvincer, error: createError } = await supabase
        .from('convincers')
        .insert({
          id: authData.user.id,
          name: name,
          email: email,
          status: 'active'
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating convincer manually:', createError);
        return res.status(500).json({ error: 'Erro ao criar perfil do usuário' });
      }

      return res.json({
        success: true,
        user: authData.user,
        convincer: newConvincer,
        session: authData.session
      });
    }

    res.json({
      success: true,
      user: authData.user,
      convincer: convincer,
      session: authData.session
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Process payment
app.post('/api/payments', async (req, res) => {
  try {
    const { convincer_id, amount_paid, time_purchased_seconds } = req.body;

    if (!convincer_id || !amount_paid || !time_purchased_seconds) {
      return res.status(400).json({ 
        error: 'Dados obrigatórios: convincer_id, amount_paid, time_purchased_seconds' 
      });
    }

    // Create payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        convincer_id,
        amount_paid,
        time_purchased_seconds,
        status: 'completed'
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment:', paymentError);
      return res.status(500).json({ error: 'Erro ao processar pagamento' });
    }

    // Update or create time balance (único por usuário)
    const { data: existingBalance, error: balanceError } = await supabase
      .from('time_balances')
      .select('*')
      .eq('convincer_id', convincer_id)
      .single();

    let timeBalance;
    if (existingBalance) {
      // Usuário já tem saldo - adicionar o novo tempo comprado
      const newTotalTime = existingBalance.amount_time_seconds + time_purchased_seconds;
      const { data: updatedBalance, error: updateError } = await supabase
        .from('time_balances')
        .update({
          amount_time_seconds: newTotalTime,
          updated_at: new Date().toISOString()
        })
        .eq('convincer_id', convincer_id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating time balance:', updateError);
        return res.status(500).json({ error: 'Erro ao atualizar saldo de tempo' });
      }
      timeBalance = updatedBalance;
    } else {
      // Primeiro saldo do usuário - criar novo registro
      const { data: newBalance, error: createError } = await supabase
        .from('time_balances')
        .insert({
          convincer_id,
          payment_id: payment.id,
          amount_time_seconds: time_purchased_seconds,
          status: 'active'
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating time balance:', createError);
        return res.status(500).json({ error: 'Erro ao criar saldo de tempo' });
      }
      timeBalance = newBalance;
    }

    res.json({
      payment,
      timeBalance,
      success: true
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Get user time balance
app.get('/api/time-balance/:convincer_id', async (req, res) => {
  try {
    const { convincer_id } = req.params;

    const { data, error } = await supabase
      .from('time_balances')
      .select('*')
      .eq('convincer_id', convincer_id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching time balance:', error);
      return res.status(500).json({ error: 'Erro ao buscar saldo de tempo' });
    }

    if (!data) {
      return res.json({
        convincer_id,
        amount_time_seconds: 0,
        status: 'inactive'
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Get time balance error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Update user time balance (decrementar tempo)
app.put('/api/time-balance/:convincer_id', async (req, res) => {
  try {
    const { convincer_id } = req.params;
    const { seconds_to_subtract } = req.body;

    if (!seconds_to_subtract || seconds_to_subtract <= 0) {
      return res.status(400).json({ error: 'Tempo a subtrair deve ser maior que zero' });
    }

    // Get current balance
    const { data: currentBalance, error: fetchError } = await supabase
      .from('time_balances')
      .select('*')
      .eq('convincer_id', convincer_id)
      .single();

    if (fetchError || !currentBalance) {
      return res.status(404).json({ error: 'Saldo de tempo não encontrado' });
    }

    // Calculate new balance
    const newTotalTime = Math.max(0, currentBalance.amount_time_seconds - seconds_to_subtract);

    // Update balance
    const { data: updatedBalance, error: updateError } = await supabase
      .from('time_balances')
      .update({
        amount_time_seconds: newTotalTime,
        updated_at: new Date().toISOString()
      })
      .eq('convincer_id', convincer_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating time balance:', updateError);
      return res.status(500).json({ error: 'Erro ao atualizar saldo de tempo' });
    }

    res.json(updatedBalance);
  } catch (error) {
    console.error('Update time balance error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Attempts endpoints
app.get('/api/attempts', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('attempts')
      .select('*, convincers(name)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching attempts:', error);
      return res.status(500).json({ error: 'Erro ao buscar tentativas' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get attempts error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Create attempt
app.post('/api/attempts', async (req, res) => {
  try {
    const { available_time_seconds } = req.body;
    const authHeader = req.headers.authorization;

    console.log('=== DEBUG CREATE ATTEMPT ===');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Raw body:', req.body);
    console.log('Body type:', typeof req.body);
    console.log('Body keys:', Object.keys(req.body));

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autorização necessário' });
    }

    const token = authHeader.substring(7);

    // Verify token with Supabase and set user context
    const { data: user, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return res.status(401).json({ error: 'Token inválido' });
    }

    if (!available_time_seconds || available_time_seconds <= 0) {
      return res.status(400).json({ error: 'available_time_seconds deve ser maior que 0' });
    }

    // Set the user context for RLS
    const supabaseWithAuth = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const { data, error } = await supabaseWithAuth
      .from('attempts')
      .insert({
        convincer_id: user.user.id,
        status: 'active',
        available_time_seconds,
        convincing_score: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating attempt:', error);
      return res.status(500).json({ error: 'Erro ao criar tentativa' });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Create attempt error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Get specific attempt
app.get('/api/attempts/:attemptId', async (req, res) => {
  try {
    const { attemptId } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autenticação necessário' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const { data, error } = await supabase
      .from('attempts')
      .select('*')
      .eq('id', attemptId)
      .eq('convincer_id', user.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Tentativa não encontrada' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get attempt error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint PATCH movido para cima para evitar conflitos

// Update attempt
app.patch('/api/attempts/:attemptId', async (req, res) => {
  try {
    console.log('=== PATCH ENDPOINT HIT ===');
    console.log('Request body:', req.body);
    console.log('Content-Type:', req.headers['content-type']);

    const { attemptId } = req.params;
    const { status, convincing_score } = req.body;

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autenticação necessário' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (convincing_score !== undefined) updateData.convincing_score = convincing_score;
    updateData.updated_at = new Date().toISOString();

    console.log('Updating attempt:', attemptId, 'with data:', updateData);

    const { data, error } = await supabase
      .from('attempts')
      .update(updateData)
      .eq('id', attemptId)
      .eq('convincer_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating attempt:', error);
      return res.status(500).json({ error: 'Erro ao atualizar tentativa', details: error });
    }

    if (!data) {
      return res.status(404).json({ error: 'Tentativa não encontrada ou não autorizada' });
    }

    console.log('Attempt updated successfully:', data);
    res.json(data);
  } catch (error) {
    console.error('Unexpected error in update attempt:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Get active attempt for user
app.get('/api/convincers/:convincerId/attempts/active', async (req, res) => {
  try {
    const { convincerId } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autenticação necessário' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    if (user.id !== convincerId) {
      return res.status(403).json({ error: 'Não autorizado' });
    }

    const { data, error } = await supabase
      .from('attempts')
      .select('*')
      .eq('convincer_id', convincerId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching active attempt:', error);
      return res.status(500).json({ error: 'Erro ao buscar tentativa ativa' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Nenhuma tentativa ativa encontrada' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get active attempt error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Get messages for attempt
app.get('/api/attempts/:attemptId/messages', async (req, res) => {
  try {
    const { attemptId } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autenticação necessário' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    // Verify user owns the attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('attempts')
      .select('convincer_id')
      .eq('id', attemptId)
      .single();

    if (attemptError || !attempt || attempt.convincer_id !== user.id) {
      return res.status(403).json({ error: 'Não autorizado' });
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('attempt_id', attemptId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return res.status(500).json({ error: 'Erro ao buscar mensagens' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get attempt messages error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Create message
app.post('/api/messages', async (req, res) => {
  try {
    console.log('=== DEBUG CREATE MESSAGE ===');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Raw body:', req.body);
    console.log('Body type:', typeof req.body);
    console.log('Body keys:', req.body ? Object.keys(req.body) : 'body is null/undefined');
    
    const { attempt_id, message } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autorização necessário' });
    }

    const token = authHeader.substring(7);

    // Verify token
    const { data: user, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return res.status(401).json({ error: 'Token inválido' });
    }

    if (!attempt_id || !message) {
      return res.status(400).json({ error: 'attempt_id e message são obrigatórios' });
    }

    // Verify user owns the attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('attempts')
      .select('convincer_id, convincing_score')
      .eq('id', attempt_id)
      .single();

    if (attemptError || !attempt || attempt.convincer_id !== user.user.id) {
      return res.status(403).json({ error: 'Não autorizado' });
    }

    // Use authenticated Supabase client
    const supabaseWithAuth = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const { data: newMessage, error: messageError } = await supabaseWithAuth
      .from('messages')
      .insert({
        attempt_id,
        convincer_id: user.user.id,
        message,
        convincing_score_snapshot: attempt.convincing_score,
        status: 'sent'
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      return res.status(500).json({ error: 'Erro ao criar mensagem' });
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Create AI response
app.post('/api/ai-responses', async (req, res) => {
  try {
    const { attempt_id, user_message_id, ai_response, convincing_score_snapshot } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autorização necessário' });
    }

    const token = authHeader.substring(7);

    // Verify token
    const { data: user, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return res.status(401).json({ error: 'Token inválido' });
    }

    if (!attempt_id || !user_message_id || !ai_response) {
      return res.status(400).json({ error: 'attempt_id, user_message_id e ai_response são obrigatórios' });
    }

    // Verify user owns the attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('attempts')
      .select('convincer_id')
      .eq('id', attempt_id)
      .single();

    if (attemptError || !attempt || attempt.convincer_id !== user.user.id) {
      return res.status(403).json({ error: 'Não autorizado' });
    }

    // Use authenticated Supabase client
    const supabaseWithAuth = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const { data: newResponse, error: responseError } = await supabaseWithAuth
      .from('ai_responses')
      .insert({
        attempt_id,        user_message_id,
        ai_response,
        convincing_score_snapshot: convincing_score_snapshot || 0,
        status: 'sent'
      })
      .select()
      .single();

    if (responseError) {
      console.error('Error creating AI response:', responseError);
      return res.status(500).json({ error: 'Erro ao criar resposta da IA' });
    }

    res.status(201).json(newResponse);
  } catch (error) {
    console.error('Create AI response error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Get AI responses for an attempt
app.get('/api/attempts/:attemptId/ai-responses', async (req, res) => {
  try {
    const { attemptId } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autorização necessário' });
    }

    const token = authHeader.substring(7);

    // Verify token
    const { data: user, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return res.status(401).json({ error: 'Token inválido' });
    }

    // Verify user owns the attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('attempts')
      .select('convincer_id')
      .eq('id', attemptId)
      .single();

    if (attemptError || !attempt || attempt.convincer_id !== user.user.id) {
      return res.status(403).json({ error: 'Não autorizado' });
    }

    const { data, error } = await supabase
      .from('ai_responses')
      .select('*')
      .eq('attempt_id', attemptId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching AI responses:', error);
      return res.status(500).json({ error: 'Erro ao buscar respostas da IA' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get attempt AI responses error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'AI Prize Persuader API Server with Supabase',
    status: 'running',
    endpoints: {
      health: 'GET /api/health',
      currentPrize: 'GET /api/prizes/current',
      statistics: 'GET /api/prizes/statistics',
      checkEmail: 'POST /api/auth/check-email',
      login: 'POST /api/auth/login',
      register: 'POST /api/auth/register',
      convincers: 'POST /api/convincers',
      attempts: 'GET /api/attempts',
      createAttempt: 'POST /api/attempts',
      getAttempt: 'GET /api/attempts/:attemptId',
      updateAttempt: 'PATCH /api/attempts/:attemptId',
      activeAttempt: 'GET /api/convincers/:convincerId/attempts/active',
      attemptMessages: 'GET /api/attempts/:attemptId/messages',
      createMessage: 'POST /api/messages',
      createAIResponse: 'POST /api/ai-responses',
      payments: 'POST /api/payments',
      timeBalance: 'GET /api/time-balance/:convincer_id',
      updateTimeBalance: 'PUT /api/time-balance/:convincer_id'
    }
  });
});

// Get recent attempts for prize display (public endpoint)
app.get('/api/recent-attempts', async (req, res) => {
  try {
    console.log('🔍 Buscando tentativas recentes...');
    
    // Use the view directly with the existing attempt_index field
    const { data, error } = await supabase
      .from('view_attempts_with_prizes')
      .select(`
        convincer_name,
        attempt_index,
        attempt_status,
        attempt_timestamp
      `)
      .order('attempt_timestamp', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching recent attempts from view:', error);
      return res.status(500).json({ error: 'Erro ao buscar tentativas recentes' });
    }

    // Transform data using the existing attempt_index from the view
    const transformedData = data?.map((attempt) => ({
      id: `attempt_${attempt.attempt_index}`, // Generate a unique ID
      convincer_name: attempt.convincer_name || 'Usuário',
      status: attempt.attempt_status,
      created_at: attempt.attempt_timestamp,
      attempt_number: attempt.attempt_index
    }));

    console.log('✅ Tentativas recentes encontradas:', transformedData?.length || 0);
    if (transformedData && transformedData.length > 0) {
      console.log('📝 Primeira tentativa:', transformedData[0]);
    }
    res.json(transformedData || []);
  } catch (error) {
    console.error('Get recent attempts error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Create HTTP server
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Store connected clients and their subscriptions
const clients = new Map();

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('🔌 Nova conexão WebSocket estabelecida');
  
  const clientId = Date.now().toString();
  clients.set(clientId, { ws, subscriptions: new Set() });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('📨 Mensagem WebSocket recebida:', data);

      if (data.type === 'subscribe_attempt' && data.attemptId) {
        // Registrar cliente para receber atualizações desta tentativa
        const client = clients.get(clientId);
        if (client) {
          client.subscriptions.add(data.attemptId);
          console.log(`✅ Cliente ${clientId} registrado para tentativa ${data.attemptId}`);
        }
      }
    } catch (error) {
      console.error('Erro ao processar mensagem WebSocket:', error);
    }
  });

  ws.on('close', () => {
    console.log(`🔌 Conexão WebSocket ${clientId} fechada`);
    clients.delete(clientId);
  });

  ws.on('error', (error) => {
    console.error(`❌ Erro WebSocket ${clientId}:`, error);
    clients.delete(clientId);
  });
});

// Função para enviar atualizações para clientes específicos
const notifyAttemptUpdate = (attemptId, attemptData) => {
  console.log(`📢 Notificando atualização da tentativa ${attemptId}:`, attemptData);
  
  clients.forEach((client, clientId) => {
    if (client.subscriptions.has(attemptId) && client.ws.readyState === 1) {
      try {
        client.ws.send(JSON.stringify({
          type: 'attempt_updated',
          attemptId: attemptId,
          convincing_score: attemptData.convincing_score,
          status: attemptData.status,
          updated_at: attemptData.updated_at
        }));
        console.log(`✅ Notificação enviada para cliente ${clientId}`);
      } catch (error) {
        console.error(`❌ Erro ao enviar notificação para cliente ${clientId}:`, error);
      }
    }
  });
};

// Função para enviar notificação de nova resposta AI
const notifyAIResponseCreated = (aiResponseData) => {
  console.log(`🤖 Notificando nova resposta AI para tentativa ${aiResponseData.attempt_id}:`, aiResponseData);
  
  clients.forEach((client, clientId) => {
    if (client.subscriptions.has(aiResponseData.attempt_id) && client.ws.readyState === 1) {
      try {
        client.ws.send(JSON.stringify({
          type: 'ai_response_created',
          attemptId: aiResponseData.attempt_id,
          aiResponseId: aiResponseData.id,
          aiResponse: aiResponseData.ai_response,
          convincingScore: aiResponseData.convincing_score_snapshot,
          created_at: aiResponseData.created_at
        }));
        console.log(`✅ Notificação AI response enviada para cliente ${clientId}`);
      } catch (error) {
        console.error(`❌ Erro ao enviar notificação AI response para cliente ${clientId}:`, error);
      }
    }
  });
};

// Configurar realtime do Supabase para escutar mudanças na tabela attempts
const attemptsChannel = supabase
  .channel('attempts-realtime')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'attempts'
    },
    (payload) => {
      console.log('🔄 Mudança detectada na tabela attempts:', payload);
      
      if (payload.new && payload.new.id) {
        notifyAttemptUpdate(payload.new.id, payload.new);
      }
    }
  )
  .subscribe((status) => {
    console.log('📡 Status da subscrição attempts realtime:', status);
  });

// Configurar realtime do Supabase para escutar mudanças na tabela ai_responses
const aiResponsesChannel = supabase
  .channel('ai-responses-realtime')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'ai_responses'
    },
    (payload) => {
      console.log('🤖 Nova AI response detectada:', payload);
      
      if (payload.new && payload.new.attempt_id) {
        notifyAIResponseCreated(payload.new);
      }
    }
  )
  .subscribe((status) => {
    console.log('📡 Status da subscrição ai_responses realtime:', status);
  });

// Iniciar servidor
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API Server with Supabase running on http://localhost:${PORT}`);
  console.log(`✅ Supabase URL: ${supabaseUrl}`);
  console.log(`🔌 WebSocket server running on ws://localhost:${PORT}`);
  console.log(`📡 Supabase realtime configured for attempts table`);
});