import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

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

// CORS middleware - Allow all origins for development
app.use(cors({
  origin: true,
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Additional CORS headers for preflight
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, Accept');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
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

// POST /api/attempts - Create new attempt
app.post('/api/attempts', async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    
    if (!req.body || typeof req.body !== 'object') {
      console.error('Invalid request body:', req.body);
      return res.status(400).json({ error: 'Dados da requisição inválidos' });
    }
    
    const { available_time_seconds } = req.body;
    
    if (!available_time_seconds || typeof available_time_seconds !== 'number') {
      console.error('Invalid available_time_seconds:', available_time_seconds);
      return res.status(400).json({ error: 'Tempo disponível inválido' });
    }
    
    // For now, use a hardcoded user ID - in production, get from auth token
    const convincer_id = '5502e1b4-a9b8-42fa-8c4e-03b3722558f9';
    
    // Check if user has available time balance
    const { data: timeBalance, error: timeError } = await supabase
      .from('time_balances')
      .select('amount_time_seconds')
      .eq('convincer_id', convincer_id)
      .single();

    if (timeError && timeError.code !== 'PGRST116') {
      console.error('Error checking time balance:', timeError);
      return res.status(500).json({ error: 'Erro ao verificar saldo de tempo' });
    }

    const availableTime = timeBalance?.amount_time_seconds || 0;
    
    if (availableTime < available_time_seconds) {
      return res.status(400).json({ error: 'Saldo de tempo insuficiente' });
    }

    // Create new attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('attempts')
      .insert({
        convincer_id,
        status: 'active',
        available_time_seconds,
        convincing_score: 0
      })
      .select()
      .single();

    if (attemptError) {
      console.error('Error creating attempt:', attemptError);
      return res.status(500).json({ error: 'Erro ao criar tentativa' });
    }

    // Deduct time from balance
    const newBalance = availableTime - available_time_seconds;
    const { error: updateError } = await supabase
      .from('time_balances')
      .update({
        amount_time_seconds: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('convincer_id', convincer_id);

    if (updateError) {
      console.error('Error updating time balance:', updateError);
      // Continue despite balance update error
    }

    res.status(201).json(attempt);
  } catch (error) {
    console.error('Create attempt error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/convincers/:id/attempts/active - Get active attempt for user
app.get('/api/convincers/:id/attempts/active', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('attempts')
      .select('*')
      .eq('convincer_id', id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching active attempt:', error);
      return res.status(500).json({ error: 'Erro ao buscar tentativa ativa' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get convincer active attempt error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PATCH /api/attempts/:id - Update attempt
app.patch('/api/attempts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const { data, error } = await supabase
      .from('attempts')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating attempt:', error);
      return res.status(500).json({ error: 'Erro ao atualizar tentativa' });
    }

    res.json(data);
  } catch (error) {
    console.error('Update attempt error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/attempts/:id/messages - Get messages for attempt
app.get('/api/attempts/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('attempt_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching attempt messages:', error);
      return res.status(500).json({ error: 'Erro ao buscar mensagens da tentativa' });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Get attempt messages error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/messages - Create message
app.post('/api/messages', async (req, res) => {
  try {
    const { attempt_id, convincer_id, message, convincing_score_snapshot } = req.body;

    const { data, error } = await supabase
      .from('messages')
      .insert({
        attempt_id,
        convincer_id,
        message,
        convincing_score_snapshot: convincing_score_snapshot || 0,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating message:', error);
      return res.status(500).json({ error: 'Erro ao criar mensagem' });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Create message error:', error);
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
      payments: 'POST /api/payments',
      timeBalance: 'GET /api/time-balance/:convincer_id',
      updateTimeBalance: 'PUT /api/time-balance/:convincer_id'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API Server with Supabase running on http://localhost:${PORT}`);
  console.log(`✅ Supabase URL: ${supabaseUrl}`);
});