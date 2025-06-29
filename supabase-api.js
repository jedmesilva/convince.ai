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

// CORS middleware
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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

    // Create time balance
    const { data: timeBalance, error: timeBalanceError } = await supabase
      .from('time_balances')
      .insert({
        convincer_id,
        payment_id: payment.id,
        amount_time_seconds: time_purchased_seconds,
        status: 'active'
      })
      .select()
      .single();

    if (timeBalanceError) {
      console.error('Error creating time balance:', timeBalanceError);
      return res.status(500).json({ error: 'Erro ao criar saldo de tempo' });
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

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'AI Prize Persuader API Server with Supabase',
    status: 'running',
    endpoints: {
      health: 'GET /api/health',
      currentPrize: 'GET /api/prizes/current',
      statistics: 'GET /api/prizes/statistics',
      convincers: 'POST /api/convincers',
      attempts: 'GET /api/attempts',
      payments: 'POST /api/payments'
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