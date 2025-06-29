import { Router } from 'express';
import { supabaseAdmin } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';

const router = Router();

// ============================================================================
// HEALTH CHECK
// ============================================================================

router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ============================================================================
// CONVINCERS (USERS)
// ============================================================================

// POST /api/convincers - Create new user
router.post('/convincers', async (req, res) => {
  try {
    const { name, email } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios' });
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
router.get('/convincers/:id', async (req, res) => {
  try {
    const { id } = req.params;

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
router.get('/prizes/current', async (req, res) => {
  try {
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
router.get('/prizes/statistics', async (req, res) => {
  try {
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
router.get('/attempts', async (req, res) => {
  try {
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
router.post('/payments', async (req, res) => {
  try {
    const { convincer_id, amount_paid, time_purchased_seconds } = req.body;
    
    if (!convincer_id || !amount_paid || !time_purchased_seconds) {
      return res.status(400).json({ error: 'Dados obrigatórios: convincer_id, amount_paid, time_purchased_seconds' });
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

export default router;