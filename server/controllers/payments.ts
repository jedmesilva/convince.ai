import { Request, Response } from 'express';
import { supabaseAdmin } from '../supabase';
import { paymentCreateSchema } from '../types';
import { v4 as uuidv4 } from 'uuid';

// POST /api/payments - Register payment
export const createPayment = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const validatedData = paymentCreateSchema.parse(req.body);
    
    const paymentId = uuidv4();
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('payments')
      .insert({
        id: paymentId,
        convincer_id: req.user.sub,
        amount_paid: validatedData.amount_paid,
        time_purchased_seconds: validatedData.time_purchased_seconds,
        status: 'pending',
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating payment:', error);
      return res.status(500).json({ error: 'Erro ao registrar pagamento' });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Create payment error:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({ error: 'Dados inválidos', details: error });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// GET /api/payments/:id - Get payment by ID
export const getPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    // Check if user owns this payment
    if (!req.user || req.user.sub !== data.convincer_id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// POST /api/payments/:id/confirm - Confirm payment (mock payment processing)
export const confirmPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Get payment
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (paymentError || !payment) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    // Check if user owns this payment
    if (payment.convincer_id !== req.user.sub) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ error: 'Pagamento já foi processado' });
    }

    // Mock payment processing - in real app, integrate with payment gateway
    const isPaymentSuccessful = Math.random() > 0.1; // 90% success rate

    if (!isPaymentSuccessful) {
      // Update payment status to failed
      await supabaseAdmin
        .from('payments')
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      return res.status(400).json({ error: 'Pagamento rejeitado' });
    }

    // Update payment status to completed
    const { data: updatedPayment, error: updateError } = await supabaseAdmin
      .from('payments')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating payment:', updateError);
      return res.status(500).json({ error: 'Erro ao confirmar pagamento' });
    }

    // Create time balance for the user
    const timeBalanceId = uuidv4();
    const now = new Date().toISOString();

    const { data: timeBalance, error: timeBalanceError } = await supabaseAdmin
      .from('time_balances')
      .insert({
        id: timeBalanceId,
        convincer_id: req.user.sub,
        payment_id: id,
        amount_time_seconds: payment.time_purchased_seconds,
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
      payment: updatedPayment,
      timeBalance
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};