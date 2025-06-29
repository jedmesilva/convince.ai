import { Request, Response } from 'express';
import { supabaseAdmin } from '../supabase';
import { timeBalanceCreateSchema } from '../types';
import { v4 as uuidv4 } from 'uuid';

// POST /api/time-balances - Create time balance (system use)
export const createTimeBalance = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const validatedData = timeBalanceCreateSchema.parse(req.body);
    
    // Verify payment exists and belongs to user
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('id', validatedData.payment_id)
      .single();

    if (paymentError || !payment) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    if (payment.convincer_id !== req.user.sub) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({ error: 'Pagamento não foi confirmado' });
    }

    // Check if time balance already exists for this payment
    const { data: existingBalance } = await supabaseAdmin
      .from('time_balances')
      .select('id')
      .eq('payment_id', validatedData.payment_id)
      .single();

    if (existingBalance) {
      return res.status(400).json({ error: 'Saldo de tempo já foi criado para este pagamento' });
    }

    const timeBalanceId = uuidv4();
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('time_balances')
      .insert({
        id: timeBalanceId,
        convincer_id: req.user.sub,
        payment_id: validatedData.payment_id,
        amount_time_seconds: validatedData.amount_time_seconds,
        status: 'active',
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating time balance:', error);
      return res.status(500).json({ error: 'Erro ao criar saldo de tempo' });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Create time balance error:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({ error: 'Dados inválidos', details: error });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// GET /api/time-balances/:id - Get time balance by ID
export const getTimeBalance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('time_balances')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Saldo de tempo não encontrado' });
    }

    // Check if user owns this time balance
    if (!req.user || req.user.sub !== data.convincer_id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get time balance error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// GET /api/convincers/:id/time-summary - Get user's time summary
export const getUserTimeSummary = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user is requesting their own data
    if (!req.user || req.user.sub !== id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Get all active time balances
    const { data: timeBalances, error: balancesError } = await supabaseAdmin
      .from('time_balances')
      .select('amount_time_seconds')
      .eq('convincer_id', id)
      .eq('status', 'active');

    if (balancesError) {
      console.error('Error fetching time balances:', balancesError);
      return res.status(500).json({ error: 'Erro ao buscar saldos de tempo' });
    }

    // Get time used in active attempts
    const { data: attempts, error: attemptsError } = await supabaseAdmin
      .from('attempts')
      .select('available_time_seconds')
      .eq('convincer_id', id)
      .eq('status', 'active');

    if (attemptsError) {
      console.error('Error fetching attempts:', attemptsError);
      return res.status(500).json({ error: 'Erro ao buscar tentativas' });
    }

    const totalPurchased = timeBalances?.reduce((sum, balance) => sum + balance.amount_time_seconds, 0) || 0;
    const totalUsed = attempts?.reduce((sum, attempt) => sum + attempt.available_time_seconds, 0) || 0;
    const availableTime = totalPurchased - totalUsed;

    res.json({
      totalPurchased,
      totalUsed,
      availableTime,
      activeAttempts: attempts?.length || 0
    });
  } catch (error) {
    console.error('Get user time summary error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};