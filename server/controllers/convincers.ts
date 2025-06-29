import { Request, Response } from 'express';
import { supabaseAdmin } from '../supabase';
import { convincerCreateSchema, convincerUpdateSchema } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Type helper for Express handlers
type AsyncHandler = (req: Request, res: Response) => Promise<any>;

// POST /api/convincers - Create new user
export const createConvincer = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = convincerCreateSchema.parse(req.body);
    
    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('convincers')
      .select('id')
      .eq('email', validatedData.email)
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
        name: validatedData.name,
        email: validatedData.email,
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
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({ error: 'Dados inválidos', details: error });
      return;
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// GET /api/convincers/:id - Get user by ID
export const getConvincer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if user is requesting their own data
    if (req.user && req.user.sub !== id) {
      return res.status(403).json({ error: 'Acesso negado' });
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
};

// PUT /api/convincers/:id - Update user profile
export const updateConvincer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if user is updating their own data
    if (!req.user || req.user.sub !== id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const validatedData = convincerUpdateSchema.parse(req.body);
    
    // If updating email, check if it's already in use
    if (validatedData.email) {
      const { data: existingUser } = await supabaseAdmin
        .from('convincers')
        .select('id')
        .eq('email', validatedData.email)
        .neq('id', id)
        .single();

      if (existingUser) {
        return res.status(400).json({ error: 'Email já está em uso' });
      }
    }

    const { data, error } = await supabaseAdmin
      .from('convincers')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating convincer:', error);
      return res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }

    res.json(data);
  } catch (error) {
    console.error('Update convincer error:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({ error: 'Dados inválidos', details: error });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// GET /api/convincers/:id/attempts - List user attempts
export const getConvincerAttempts = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if user is requesting their own data
    if (!req.user || req.user.sub !== id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { data, error } = await supabaseAdmin
      .from('attempts')
      .select('*')
      .eq('convincer_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching attempts:', error);
      return res.status(500).json({ error: 'Erro ao buscar tentativas' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get convincer attempts error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// GET /api/convincers/:id/payments - List user payments
export const getConvincerPayments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if user is requesting their own data
    if (!req.user || req.user.sub !== id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('convincer_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
      return res.status(500).json({ error: 'Erro ao buscar pagamentos' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get convincer payments error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// GET /api/convincers/:id/time-balances - List user time balances
export const getConvincerTimeBalances = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if user is requesting their own data
    if (!req.user || req.user.sub !== id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { data, error } = await supabaseAdmin
      .from('time_balances')
      .select('*')
      .eq('convincer_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching time balances:', error);
      return res.status(500).json({ error: 'Erro ao buscar saldos de tempo' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get convincer time balances error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// GET /api/convincers/:id/withdrawals - List user withdrawals
export const getConvincerWithdrawals = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if user is requesting their own data
    if (!req.user || req.user.sub !== id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { data, error } = await supabaseAdmin
      .from('withdrawals')
      .select('*')
      .eq('convincer_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching withdrawals:', error);
      return res.status(500).json({ error: 'Erro ao buscar saques' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get convincer withdrawals error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// GET /api/convincers/:id/prize-certificates - List user prize certificates
export const getConvincerPrizeCertificates = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if user is requesting their own data
    if (!req.user || req.user.sub !== id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { data, error } = await supabaseAdmin
      .from('prize_certificates')
      .select('*')
      .eq('convincer_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching prize certificates:', error);
      return res.status(500).json({ error: 'Erro ao buscar certificados de prêmio' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get convincer prize certificates error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};