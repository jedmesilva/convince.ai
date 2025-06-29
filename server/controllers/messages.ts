import { Request, Response } from 'express';
import { supabaseAdmin } from '../supabase';
import { messageCreateSchema, messageUpdateSchema } from '../types';
import { v4 as uuidv4 } from 'uuid';

// POST /api/messages - Create new message
export const createMessage = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const validatedData = messageCreateSchema.parse(req.body);
    
    // Check if attempt exists and belongs to user
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('attempts')
      .select('convincer_id, convincing_score, status')
      .eq('id', validatedData.attempt_id)
      .single();

    if (attemptError || !attempt) {
      return res.status(404).json({ error: 'Tentativa não encontrada' });
    }

    if (attempt.convincer_id !== req.user.sub) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    if (attempt.status !== 'active') {
      return res.status(400).json({ error: 'Tentativa não está ativa' });
    }

    const messageId = uuidv4();
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert({
        id: messageId,
        attempt_id: validatedData.attempt_id,
        convincer_id: req.user.sub,
        message: validatedData.message,
        convincing_score_snapshot: attempt.convincing_score,
        status: 'sent',
        created_at: now,
        updated_at: now
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
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({ error: 'Dados inválidos', details: error });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// PATCH /api/messages/:id - Update message status
export const updateMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // First check if message exists and get owner
    const { data: message, error: fetchError } = await supabaseAdmin
      .from('messages')
      .select('convincer_id')
      .eq('id', id)
      .single();

    if (fetchError || !message) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }

    // Check if user owns this message
    if (!req.user || req.user.sub !== message.convincer_id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const validatedData = messageUpdateSchema.parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('messages')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating message:', error);
      return res.status(500).json({ error: 'Erro ao atualizar mensagem' });
    }

    res.json(data);
  } catch (error) {
    console.error('Update message error:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({ error: 'Dados inválidos', details: error });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};