import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';

const app = express();
const PORT = process.env.API_PORT || 3001;

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabaseAdmin;
if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
} else {
  console.warn('⚠️  SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured. Using mock data.');
}

// CORS middleware
app.use(cors({
  origin: ['http://localhost:5000', 'http://localhost:8080', 'http://localhost:3000'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`API ${req.method} ${path} ${res.statusCode} in ${duration}ms`);
  });
  
  next();
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    supabase: supabaseAdmin ? 'connected' : 'not configured'
  });
});

// ============================================================================
// CONVINCERS (USERS)
// ============================================================================

// POST /api/convincers - Create new user
app.post('/api/convincers', async (req, res) => {
  try {
    const { name, email } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }

    if (!supabaseAdmin) {
      // Mock response when Supabase is not configured
      const mockUser = {
        id: uuidv4(),
        name,
        email,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return res.status(201).json(mockUser);
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('convincers')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Email já está em uso' });
    }

    const convincerId = uuidv4();
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('convincers')
      .insert({
        id: convincerId,
        name,
        email,
        status: 'active',
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating convincer:', error);
      return res.status(500).json({ error: 'Erro ao criar usuário' });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Create convincer error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/convincers/:id - Get user by ID
app.get('/api/convincers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!supabaseAdmin) {
      // Mock response
      const mockUser = {
        id,
        name: 'Usuário Demo',
        email: 'demo@exemplo.com',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return res.json(mockUser);
    }

    const { data, error } = await supabaseAdmin
      .from('convincers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get convincer error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ============================================================================
// PRIZES
// ============================================================================

// GET /api/prizes/current - Get current active prize
app.get('/api/prizes/current', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      // Mock response
      const mockPrize = {
        id: uuidv4(),
        amount: 150.00,
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return res.json(mockPrize);
    }

    const { data, error } = await supabaseAdmin
      .from('prizes')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      // If no prize exists, create a default one
      const prizeId = uuidv4();
      const now = new Date().toISOString();

      const { data: newPrize, error: createError } = await supabaseAdmin
        .from('prizes')
        .insert({
          id: prizeId,
          amount: 100.00, // Default $100 prize
          status: 'open',
          created_at: now,
          updated_at: now
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating default prize:', createError);
        return res.status(500).json({ error: 'Erro ao criar prêmio padrão' });
      }

      return res.json(newPrize);
    }

    res.json(data);
  } catch (error) {
    console.error('Get current prize error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/prizes/statistics - Get prize statistics
app.get('/api/prizes/statistics', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      // Mock response
      const mockStats = {
        totalAttempts: 127,
        successfulAttempts: 3,
        failedAttempts: 124,
        currentPrizeAmount: 150.00,
        successRate: '2.36'
      };
      return res.json(mockStats);
    }

    // Get total attempts
    const { count: totalAttempts, error: attemptsError } = await supabaseAdmin
      .from('attempts')
      .select('*', { count: 'exact', head: true });

    if (attemptsError) {
      console.error('Error counting attempts:', attemptsError);
      return res.status(500).json({ error: 'Erro ao contar tentativas' });
    }

    // Get successful attempts (winners)
    const { count: successfulAttempts, error: successfulError } = await supabaseAdmin
      .from('attempts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('convincing_score', 95);

    if (successfulError) {
      console.error('Error counting successful attempts:', successfulError);
      return res.status(500).json({ error: 'Erro ao contar tentativas bem-sucedidas' });
    }

    // Get current prize
    const { data: currentPrize } = await supabaseAdmin
      .from('prizes')
      .select('amount')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const currentPrizeAmount = currentPrize ? Number(currentPrize.amount) : 100;
    const failedAttempts = (totalAttempts || 0) - (successfulAttempts || 0);

    res.json({
      totalAttempts: totalAttempts || 0,
      successfulAttempts: successfulAttempts || 0,
      failedAttempts,
      currentPrizeAmount,
      successRate: totalAttempts ? ((successfulAttempts || 0) / totalAttempts * 100).toFixed(2) : '0.00'
    });
  } catch (error) {
    console.error('Get prize statistics error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ============================================================================
// ATTEMPTS
// ============================================================================

// GET /api/attempts - Get all attempts (public, for display)
app.get('/api/attempts', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      // Mock response
      const mockAttempts = [
        {
          id: uuidv4(),
          status: 'failed',
          convincing_score: 23,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          convincers: { name: 'Ana Silva' }
        },
        {
          id: uuidv4(),
          status: 'failed',
          convincing_score: 67,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          convincers: { name: 'João Santos' }
        },
        {
          id: uuidv4(),
          status: 'completed',
          convincing_score: 98,
          created_at: new Date(Date.now() - 10800000).toISOString(),
          convincers: { name: 'Maria Costa' }
        }
      ];
      return res.json(mockAttempts);
    }

    const { data, error } = await supabaseAdmin
      .from('attempts')
      .select(`
        id,
        status,
        convincing_score,
        created_at,
        convincers (
          name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

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

// ============================================================================
// PAYMENTS (SIMPLIFIED)
// ============================================================================

// POST /api/payments - Register and process payment (mock)
app.post('/api/payments', async (req, res) => {
  try {
    const { convincer_id, amount_paid, time_purchased_seconds } = req.body;
    
    if (!convincer_id || !amount_paid || !time_purchased_seconds) {
      return res.status(400).json({ error: 'Dados obrigatórios: convincer_id, amount_paid, time_purchased_seconds' });
    }

    if (!supabaseAdmin) {
      // Mock payment processing
      const mockPayment = {
        id: uuidv4(),
        convincer_id,
        amount_paid,
        time_purchased_seconds,
        status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const mockTimeBalance = {
        id: uuidv4(),
        convincer_id,
        payment_id: mockPayment.id,
        amount_time_seconds: time_purchased_seconds,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return res.json({
        payment: mockPayment,
        timeBalance: mockTimeBalance,
        success: true
      });
    }

    // Verify user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('convincers')
      .select('id')
      .eq('id', convincer_id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const paymentId = uuidv4();
    const now = new Date().toISOString();

    // Mock payment processing - 90% success rate
    const isPaymentSuccessful = Math.random() > 0.1;
    const paymentStatus = isPaymentSuccessful ? 'completed' : 'failed';

    // Create payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        id: paymentId,
        convincer_id,
        amount_paid,
        time_purchased_seconds,
        status: paymentStatus,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment:', paymentError);
      return res.status(500).json({ error: 'Erro ao registrar pagamento' });
    }

    if (!isPaymentSuccessful) {
      return res.status(400).json({ 
        error: 'Pagamento rejeitado',
        payment 
      });
    }

    // Create time balance for successful payment
    const timeBalanceId = uuidv4();
    const { data: timeBalance, error: timeBalanceError } = await supabaseAdmin
      .from('time_balances')
      .insert({
        id: timeBalanceId,
        convincer_id,
        payment_id: paymentId,
        amount_time_seconds: time_purchased_seconds,
        status: 'active',
        created_at: now,
        updated_at: now
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
    console.error('Payment error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ============================================================================
// ROOT ENDPOINT
// ============================================================================

app.get('/', (req, res) => {
  res.json({ 
    message: 'AI Prize Persuader API Server',
    status: 'running',
    version: '1.0.0',
    supabase: supabaseAdmin ? 'connected' : 'not configured (using mock data)',
    endpoints: {
      health: 'GET /api/health',
      convincers: 'POST /api/convincers',
      prizes: 'GET /api/prizes/current',
      statistics: 'GET /api/prizes/statistics',
      attempts: 'GET /api/attempts',
      payments: 'POST /api/payments'
    }
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API Server running on http://0.0.0.0:${PORT}`);
  console.log(`📋 API Documentation available at http://localhost:${PORT}`);
  
  if (!supabaseAdmin) {
    console.log(`⚠️  Running in MOCK MODE - Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for production`);
  }
});

export default app;