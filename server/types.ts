import { z } from 'zod';

// Database Types
export interface Convincer {
  id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Attempt {
  id: string;
  convincer_id: string;
  status: string;
  available_time_seconds: number;
  convincing_score: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  attempt_id: string;
  convincer_id: string;
  message: string;
  convincing_score_snapshot: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AIResponse {
  id: string;
  attempt_id: string;
  user_message_id: string;
  ai_response: string;
  convincing_score_snapshot: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TimeBalance {
  id: string;
  convincer_id: string;
  payment_id: string;
  amount_time_seconds: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  convincer_id: string;
  amount_paid: number;
  time_purchased_seconds: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Prize {
  id: string;
  amount: number;
  distributed_at?: string;
  winner_convincer_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PrizeCertificate {
  id: string;
  convincer_id: string;
  prize_id: string;
  hash: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Withdrawal {
  id: string;
  convincer_id: string;
  prize_id: string;
  certificate_id: string;
  hash: string;
  amount_withdrawn: number;
  requested_at: string;
  completed_at?: string;
  status: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Validation Schemas
export const convincerCreateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
});

export const convincerUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export const attemptCreateSchema = z.object({
  available_time_seconds: z.number().min(1, 'Tempo deve ser maior que 0'),
});

export const attemptUpdateSchema = z.object({
  status: z.enum(['active', 'completed', 'failed', 'expired', 'abandoned']).optional(),
  convincing_score: z.number().min(0).max(100).optional(),
});

export const messageCreateSchema = z.object({
  attempt_id: z.string().uuid('ID da tentativa inválido'),
  message: z.string().min(1, 'Mensagem não pode estar vazia'),
});

export const messageUpdateSchema = z.object({
  status: z.enum(['sent', 'read', 'processed']).optional(),
});

export const aiResponseCreateSchema = z.object({
  attempt_id: z.string().uuid(),
  user_message_id: z.string().uuid(),
  ai_response: z.string().min(1),
  convincing_score_snapshot: z.number().min(0).max(100),
});

export const paymentCreateSchema = z.object({
  amount_paid: z.number().positive('Valor deve ser positivo'),
  time_purchased_seconds: z.number().positive('Tempo deve ser positivo'),
});

export const timeBalanceCreateSchema = z.object({
  payment_id: z.string().uuid(),
  amount_time_seconds: z.number().positive(),
});

export const withdrawalCreateSchema = z.object({
  prize_id: z.string().uuid(),
  certificate_id: z.string().uuid(),
  amount_withdrawn: z.number().positive(),
  description: z.string().optional(),
});

export const withdrawalUpdateSchema = z.object({
  status: z.enum(['pending', 'approved', 'completed', 'rejected']).optional(),
  completed_at: z.string().optional(),
});

// JWT Payload Type
export interface JWTPayload {
  sub: string; // user id
  email: string;
  iat: number;
  exp: number;
}

// Request Extensions
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}