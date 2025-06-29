import { Request, Response } from 'express';
import { supabaseAdmin } from '../supabase';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';

// GET /api/prizes - List current prizes
export const getPrizes = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('prizes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching prizes:', error);
      return res.status(500).json({ error: 'Erro ao buscar prêmios' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get prizes error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// GET /api/prizes/:id - Get prize details
export const getPrize = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('prizes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Prêmio não encontrado' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get prize error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// GET /api/prizes/current - Get current active prize
export const getCurrentPrize = async (req: Request, res: Response) => {
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
          amount: 100.00, // Default $100 prize
          status: 'open'
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
};

// POST /api/prizes/:id/award - Award prize to winner (system use)
export const awardPrize = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { winnerId, attemptId } = req.body;

    if (!winnerId || !attemptId) {
      return res.status(400).json({ error: 'winnerId and attemptId são obrigatórios' });
    }

    // Check if prize exists and is open
    const { data: prize, error: prizeError } = await supabaseAdmin
      .from('prizes')
      .select('*')
      .eq('id', id)
      .single();

    if (prizeError || !prize) {
      return res.status(404).json({ error: 'Prêmio não encontrado' });
    }

    if (prize.status !== 'open') {
      return res.status(400).json({ error: 'Prêmio não está disponível' });
    }

    // Check if attempt exists and belongs to winner
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('attempts')
      .select('*')
      .eq('id', attemptId)
      .single();

    if (attemptError || !attempt) {
      return res.status(404).json({ error: 'Tentativa não encontrada' });
    }

    if (attempt.convincer_id !== winnerId) {
      return res.status(400).json({ error: 'Tentativa não pertence ao vencedor' });
    }

    if (attempt.convincing_score < 95) {
      return res.status(400).json({ error: 'Score insuficiente para ganhar o prêmio' });
    }

    const now = new Date().toISOString();

    // Update prize with winner
    const { data: updatedPrize, error: updateError } = await supabaseAdmin
      .from('prizes')
      .update({
        winner_convincer_id: winnerId,
        distributed_at: now,
        status: 'distributed',
        updated_at: now
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating prize:', updateError);
      return res.status(500).json({ error: 'Erro ao atualizar prêmio' });
    }

    // Create prize certificate
    const certificateId = uuidv4();
    const hashInput = `${certificateId}-${winnerId}-${id}-${now}`;
    const certificateHash = createHash('sha256').update(hashInput).digest('hex');

    const { data: certificate, error: certificateError } = await supabaseAdmin
      .from('prize_certificates')
      .insert({
        id: certificateId,
        convincer_id: winnerId,
        prize_id: id,
        hash: certificateHash,
        status: 'active',
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (certificateError) {
      console.error('Error creating certificate:', certificateError);
      return res.status(500).json({ error: 'Erro ao criar certificado' });
    }

    // Create new prize for next round
    const nextPrizeId = uuidv4();
    const nextPrizeAmount = prize.amount + 50; // Increase by $50

    const { data: nextPrize, error: nextPrizeError } = await supabaseAdmin
      .from('prizes')
      .insert({
        id: nextPrizeId,
        amount: nextPrizeAmount,
        status: 'open',
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (nextPrizeError) {
      console.error('Error creating next prize:', nextPrizeError);
      // This is not critical, so we don't fail the request
    }

    res.json({
      prize: updatedPrize,
      certificate,
      nextPrize
    });
  } catch (error) {
    console.error('Award prize error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// GET /api/prizes/statistics - Get prize statistics
export const getPrizeStatistics = async (req: Request, res: Response) => {
  try {
    // Get current prize
    const { data: currentPrize, error: currentError } = await supabaseAdmin
      .from('prizes')
      .select('amount')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let currentPrizeAmount = 100; // Default fallback
    if (!currentError && currentPrize) {
      currentPrizeAmount = Number(currentPrize.amount);
    }

    // Get basic counts with error handling
    let totalAttempts = 0;
    let successfulAttempts = 0;

    try {
      const { count: attemptCount } = await supabaseAdmin
        .from('attempts')
        .select('*', { count: 'exact', head: true });
      totalAttempts = attemptCount || 0;
    } catch (error) {
      console.log('Could not count attempts, using 0');
    }

    try {
      const { count: successCount } = await supabaseAdmin
        .from('attempts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('convincing_score', 95);
      successfulAttempts = successCount || 0;
    } catch (error) {
      console.log('Could not count successful attempts, using 0');
    }

    const failedAttempts = Math.max(0, totalAttempts - successfulAttempts);
    const successRate = totalAttempts > 0 ? ((successfulAttempts / totalAttempts) * 100).toFixed(2) : '0.00';

    res.json({
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      currentPrizeAmount,
      successRate: `${successRate}%`
    });
  } catch (error) {
    console.error('Get prize statistics error:', error);
    // Return basic statistics even if there's an error
    res.json({
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      currentPrizeAmount: 100,
      successRate: '0.00%'
    });
  }
};