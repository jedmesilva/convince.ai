import { Request, Response } from 'express';
import { supabaseAdmin } from '../supabase';
import { attemptCreateSchema, attemptUpdateSchema } from '../types';
import { v4 as uuidv4 } from 'uuid';

// POST /api/attempts - Create new attempt
export const createAttempt = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const validatedData = attemptCreateSchema.parse(req.body);
    
    // Check if user has available time balance
    const { data: timeBalances, error: timeError } = await supabaseAdmin
      .from('time_balances')
      .select('amount_time_seconds')
      .eq('convincer_id', req.user.sub)
      .eq('status', 'active');

    if (timeError) {
      console.error('Error checking time balance:', timeError);
      return res.status(500).json({ error: 'Erro ao verificar saldo de tempo' });
    }

    const totalAvailableTime = timeBalances?.reduce((sum, balance) => sum + balance.amount_time_seconds, 0) || 0;
    
    if (totalAvailableTime < validatedData.available_time_seconds) {
      return res.status(400).json({ error: 'Saldo de tempo insuficiente' });
    }

    const attemptId = uuidv4();
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('attempts')
      .insert({
        id: attemptId,
        convincer_id: req.user.sub,
        status: 'active',
        available_time_seconds: validatedData.available_time_seconds,
        convincing_score: 0,
        created_at: now,
        updated_at: now
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
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({ error: 'Dados inválidos', details: error });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// GET /api/attempts/:id - Get attempt by ID
export const getAttempt = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('attempts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Tentativa não encontrada' });
    }

    // Check if user owns this attempt or if it's public
    if (req.user && req.user.sub !== data.convincer_id) {
      // Only return public data for non-owners
      const publicData = {
        id: data.id,
        status: data.status,
        convincing_score: data.convincing_score,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
      return res.json(publicData);
    }

    res.json(data);
  } catch (error) {
    console.error('Get attempt error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// PATCH /api/attempts/:id - Update attempt status or score
export const updateAttempt = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // First check if attempt exists and get owner
    const { data: attempt, error: fetchError } = await supabaseAdmin
      .from('attempts')
      .select('convincer_id')
      .eq('id', id)
      .single();

    if (fetchError || !attempt) {
      return res.status(404).json({ error: 'Tentativa não encontrada' });
    }

    // Check if user owns this attempt
    if (!req.user || req.user.sub !== attempt.convincer_id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const validatedData = attemptUpdateSchema.parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('attempts')
      .update({
        ...validatedData,
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
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({ error: 'Dados inválidos', details: error });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// GET /api/attempts/:id/messages - List messages for an attempt
export const getAttemptMessages = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if attempt exists
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('attempts')
      .select('convincer_id')
      .eq('id', id)
      .single();

    if (attemptError || !attempt) {
      return res.status(404).json({ error: 'Tentativa não encontrada' });
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('attempt_id', id)
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
};

// GET /api/attempts/:id/ai-responses - List AI responses for an attempt
export const getAttemptAiResponses = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if attempt exists
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('attempts')
      .select('convincer_id')
      .eq('id', id)
      .single();

    if (attemptError || !attempt) {
      return res.status(404).json({ error: 'Tentativa não encontrada' });
    }

    const { data, error } = await supabaseAdmin
      .from('ai_responses')
      .select('*')
      .eq('attempt_id', id)
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
};