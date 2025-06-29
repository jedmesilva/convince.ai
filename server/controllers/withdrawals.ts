import { Request, Response } from 'express';
import { supabaseAdmin } from '../supabase';
import { withdrawalCreateSchema, withdrawalUpdateSchema } from '../types';
import { v4 as uuidv4 } from 'uuid';

// POST /api/withdrawals - Request withdrawal
export const createWithdrawal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const validatedData = withdrawalCreateSchema.parse(req.body);
    
    // Verify prize exists and belongs to user
    const { data: prize, error: prizeError } = await supabaseAdmin
      .from('prizes')
      .select('*')
      .eq('id', validatedData.prize_id)
      .single();

    if (prizeError || !prize) {
      return res.status(404).json({ error: 'Prêmio não encontrado' });
    }

    if (prize.winner_convincer_id !== req.user.sub) {
      return res.status(403).json({ error: 'Você não é o vencedor deste prêmio' });
    }

    if (prize.status !== 'distributed') {
      return res.status(400).json({ error: 'Prêmio não foi distribuído' });
    }

    // Verify certificate exists
    const { data: certificate, error: certificateError } = await supabaseAdmin
      .from('prize_certificates')
      .select('*')
      .eq('id', validatedData.certificate_id)
      .single();

    if (certificateError || !certificate) {
      return res.status(404).json({ error: 'Certificado não encontrado' });
    }

    if (certificate.convincer_id !== req.user.sub || certificate.prize_id !== validatedData.prize_id) {
      return res.status(403).json({ error: 'Certificado não pertence a você ou não corresponde ao prêmio' });
    }

    // Check if withdrawal already exists for this prize
    const { data: existingWithdrawal } = await supabaseAdmin
      .from('withdrawals')
      .select('id')
      .eq('prize_id', validatedData.prize_id)
      .eq('convincer_id', req.user.sub)
      .single();

    if (existingWithdrawal) {
      return res.status(400).json({ error: 'Saque já foi solicitado para este prêmio' });
    }

    const withdrawalId = uuidv4();
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('withdrawals')
      .insert({
        id: withdrawalId,
        convincer_id: req.user.sub,
        prize_id: validatedData.prize_id,
        certificate_id: validatedData.certificate_id,
        hash: certificate.hash,
        amount_withdrawn: validatedData.amount_withdrawn,
        requested_at: now,
        status: 'pending',
        description: validatedData.description,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating withdrawal:', error);
      return res.status(500).json({ error: 'Erro ao solicitar saque' });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Create withdrawal error:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({ error: 'Dados inválidos', details: error });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// GET /api/withdrawals/:id - Get withdrawal by ID
export const getWithdrawal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('withdrawals')
      .select(`
        *,
        prizes (
          id,
          amount,
          distributed_at
        ),
        prize_certificates (
          id,
          hash
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Saque não encontrado' });
    }

    // Check if user owns this withdrawal
    if (!req.user || req.user.sub !== data.convincer_id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get withdrawal error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// PATCH /api/withdrawals/:id - Update withdrawal status (admin use)
export const updateWithdrawal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // First check if withdrawal exists
    const { data: withdrawal, error: fetchError } = await supabaseAdmin
      .from('withdrawals')
      .select('convincer_id')
      .eq('id', id)
      .single();

    if (fetchError || !withdrawal) {
      return res.status(404).json({ error: 'Saque não encontrado' });
    }

    // Check if user owns this withdrawal (users can only update their own)
    if (!req.user || req.user.sub !== withdrawal.convincer_id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const validatedData = withdrawalUpdateSchema.parse(req.body);

    const updateData: any = {
      ...validatedData,
      updated_at: new Date().toISOString()
    };

    // If status is being changed to completed, set completed_at
    if (validatedData.status === 'completed' && !validatedData.completed_at) {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('withdrawals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating withdrawal:', error);
      return res.status(500).json({ error: 'Erro ao atualizar saque' });
    }

    res.json(data);
  } catch (error) {
    console.error('Update withdrawal error:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({ error: 'Dados inválidos', details: error });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// GET /api/withdrawals/pending - Get pending withdrawals (admin use)
export const getPendingWithdrawals = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('withdrawals')
      .select(`
        *,
        convincers (
          id,
          name,
          email
        ),
        prizes (
          id,
          amount,
          distributed_at
        )
      `)
      .eq('status', 'pending')
      .order('requested_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending withdrawals:', error);
      return res.status(500).json({ error: 'Erro ao buscar saques pendentes' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get pending withdrawals error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};