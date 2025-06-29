import { Request, Response } from 'express';
import { supabaseAdmin } from '../supabase';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';

// POST /api/prize-certificates - Create certificate (system use)
export const createPrizeCertificate = async (req: Request, res: Response) => {
  try {
    const { convincer_id, prize_id } = req.body;

    if (!convincer_id || !prize_id) {
      return res.status(400).json({ error: 'convincer_id e prize_id são obrigatórios' });
    }

    // Verify prize exists and is distributed
    const { data: prize, error: prizeError } = await supabaseAdmin
      .from('prizes')
      .select('*')
      .eq('id', prize_id)
      .single();

    if (prizeError || !prize) {
      return res.status(404).json({ error: 'Prêmio não encontrado' });
    }

    if (prize.status !== 'distributed' || prize.winner_convincer_id !== convincer_id) {
      return res.status(400).json({ error: 'Prêmio não foi distribuído para este usuário' });
    }

    // Check if certificate already exists
    const { data: existingCertificate } = await supabaseAdmin
      .from('prize_certificates')
      .select('id')
      .eq('prize_id', prize_id)
      .eq('convincer_id', convincer_id)
      .single();

    if (existingCertificate) {
      return res.status(400).json({ error: 'Certificado já existe para este prêmio' });
    }

    const certificateId = uuidv4();
    const now = new Date().toISOString();
    const hashInput = `${certificateId}-${convincer_id}-${prize_id}-${now}`;
    const certificateHash = createHash('sha256').update(hashInput).digest('hex');

    const { data, error } = await supabaseAdmin
      .from('prize_certificates')
      .insert({
        id: certificateId,
        convincer_id,
        prize_id,
        hash: certificateHash,
        status: 'active',
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating certificate:', error);
      return res.status(500).json({ error: 'Erro ao criar certificado' });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Create prize certificate error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// GET /api/prize-certificates/:id - Get certificate by ID
export const getPrizeCertificate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('prize_certificates')
      .select(`
        *,
        prizes (
          id,
          amount,
          distributed_at
        ),
        convincers (
          id,
          name,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Certificado não encontrado' });
    }

    // Check if user owns this certificate
    if (req.user && req.user.sub !== data.convincer_id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get prize certificate error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// GET /api/prize-certificates/verify/:hash - Verify certificate by hash
export const verifyCertificate = async (req: Request, res: Response) => {
  try {
    const { hash } = req.params;

    const { data, error } = await supabaseAdmin
      .from('prize_certificates')
      .select(`
        *,
        prizes (
          id,
          amount,
          distributed_at
        ),
        convincers (
          id,
          name
        )
      `)
      .eq('hash', hash)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Certificado não encontrado ou inválido' });
    }

    if (data.status !== 'active') {
      return res.status(400).json({ error: 'Certificado não está ativo' });
    }

    // Return public verification data
    res.json({
      id: data.id,
      hash: data.hash,
      status: data.status,
      created_at: data.created_at,
      prize: {
        amount: data.prizes.amount,
        distributed_at: data.prizes.distributed_at
      },
      winner: {
        name: data.convincers.name
      },
      isValid: true
    });
  } catch (error) {
    console.error('Verify certificate error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};