import { Router } from 'express';
import { authMiddleware, optionalAuthMiddleware } from './supabase';

// Import controllers
import {
  createConvincer,
  getConvincer,
  updateConvincer,
  getConvincerAttempts,
  getConvincerPayments,
  getConvincerTimeBalances,
  getConvincerWithdrawals,
  getConvincerPrizeCertificates
} from './controllers/convincers';

import {
  createAttempt,
  getAttempt,
  updateAttempt,
  getAttemptMessages,
  getAttemptAiResponses
} from './controllers/attempts';

import {
  createMessage,
  updateMessage
} from './controllers/messages';

import {
  createAIResponse,
  getAIResponse,
  generateAIResponseForMessage
} from './controllers/aiResponses';

import {
  createPayment,
  getPayment,
  confirmPayment
} from './controllers/payments';

import {
  createTimeBalance,
  getTimeBalance,
  getUserTimeSummary
} from './controllers/timeBalances';

import {
  getPrizes,
  getPrize,
  getCurrentPrize,
  awardPrize,
  getPrizeStatistics
} from './controllers/prizes';

import {
  createPrizeCertificate,
  getPrizeCertificate,
  verifyCertificate
} from './controllers/prizeCertificates';

import {
  createWithdrawal,
  getWithdrawal,
  updateWithdrawal,
  getPendingWithdrawals
} from './controllers/withdrawals';

const router = Router();

// ============================================================================
// 1️⃣ CONVINCERS (USERS) ROUTES
// ============================================================================

// POST /api/convincers - Create new user
router.post('/convincers', createConvincer);

// GET /api/convincers/:id - Get user by ID
router.get('/convincers/:id', optionalAuthMiddleware, getConvincer);

// PUT /api/convincers/:id - Update user profile
router.put('/convincers/:id', authMiddleware, updateConvincer);

// GET /api/convincers/:id/attempts - List user attempts
router.get('/convincers/:id/attempts', authMiddleware, getConvincerAttempts);

// GET /api/convincers/:id/payments - List user payments
router.get('/convincers/:id/payments', authMiddleware, getConvincerPayments);

// GET /api/convincers/:id/time-balances - List user time balances
router.get('/convincers/:id/time-balances', authMiddleware, getConvincerTimeBalances);

// GET /api/convincers/:id/withdrawals - List user withdrawals
router.get('/convincers/:id/withdrawals', authMiddleware, getConvincerWithdrawals);

// GET /api/convincers/:id/prize-certificates - List user certificates
router.get('/convincers/:id/prize-certificates', authMiddleware, getConvincerPrizeCertificates);

// GET /api/convincers/:id/time-summary - Get user time summary
router.get('/convincers/:id/time-summary', authMiddleware, getUserTimeSummary);

// ============================================================================
// 2️⃣ ATTEMPTS ROUTES
// ============================================================================

// POST /api/attempts - Create new attempt
router.post('/attempts', authMiddleware, createAttempt);

// GET /api/attempts/:id - Get attempt by ID
router.get('/attempts/:id', optionalAuthMiddleware, getAttempt);

// PATCH /api/attempts/:id - Update attempt status or score
router.patch('/attempts/:id', authMiddleware, updateAttempt);

// GET /api/attempts/:id/messages - List messages for an attempt
router.get('/attempts/:id/messages', getAttemptMessages);

// GET /api/attempts/:id/ai-responses - List AI responses for an attempt
router.get('/attempts/:id/ai-responses', getAttemptAiResponses);

// ============================================================================
// 3️⃣ MESSAGES ROUTES
// ============================================================================

// POST /api/messages - Create new message
router.post('/messages', authMiddleware, createMessage);

// PATCH /api/messages/:id - Update message status
router.patch('/messages/:id', authMiddleware, updateMessage);

// POST /api/messages/:messageId/generate-ai-response - Generate AI response
router.post('/messages/:messageId/generate-ai-response', authMiddleware, generateAIResponseForMessage);

// ============================================================================
// 4️⃣ AI RESPONSES ROUTES
// ============================================================================

// POST /api/ai-responses - Create AI response (internal)
router.post('/ai-responses', createAIResponse);

// GET /api/ai-responses/:id - Get AI response by ID
router.get('/ai-responses/:id', getAIResponse);

// ============================================================================
// 5️⃣ PAYMENTS ROUTES
// ============================================================================

// POST /api/payments - Register payment
router.post('/payments', authMiddleware, createPayment);

// GET /api/payments/:id - Get payment by ID
router.get('/payments/:id', authMiddleware, getPayment);

// POST /api/payments/:id/confirm - Confirm payment
router.post('/payments/:id/confirm', authMiddleware, confirmPayment);

// ============================================================================
// 6️⃣ TIME BALANCES ROUTES
// ============================================================================

// POST /api/time-balances - Create time balance (system use)
router.post('/time-balances', authMiddleware, createTimeBalance);

// GET /api/time-balances/:id - Get time balance by ID
router.get('/time-balances/:id', authMiddleware, getTimeBalance);

// ============================================================================
// 7️⃣ PRIZES ROUTES
// ============================================================================

// GET /api/prizes - List current prizes
router.get('/prizes', getPrizes);

// GET /api/prizes/current - Get current active prize
router.get('/prizes/current', getCurrentPrize);

// GET /api/prizes/statistics - Get prize statistics
router.get('/prizes/statistics', getPrizeStatistics);

// GET /api/prizes/:id - Get prize details
router.get('/prizes/:id', getPrize);

// POST /api/prizes/:id/award - Award prize to winner (system use)
router.post('/prizes/:id/award', awardPrize);

// ============================================================================
// 8️⃣ PRIZE CERTIFICATES ROUTES
// ============================================================================

// POST /api/prize-certificates - Create certificate (system use)
router.post('/prize-certificates', createPrizeCertificate);

// GET /api/prize-certificates/:id - Get certificate by ID
router.get('/prize-certificates/:id', optionalAuthMiddleware, getPrizeCertificate);

// GET /api/prize-certificates/verify/:hash - Verify certificate by hash
router.get('/prize-certificates/verify/:hash', verifyCertificate);

// ============================================================================
// 9️⃣ WITHDRAWALS ROUTES
// ============================================================================

// POST /api/withdrawals - Request withdrawal
router.post('/withdrawals', authMiddleware, createWithdrawal);

// GET /api/withdrawals/:id - Get withdrawal by ID
router.get('/withdrawals/:id', authMiddleware, getWithdrawal);

// PATCH /api/withdrawals/:id - Update withdrawal status
router.patch('/withdrawals/:id', authMiddleware, updateWithdrawal);

// GET /api/withdrawals/pending - Get pending withdrawals
router.get('/withdrawals/pending', getPendingWithdrawals);

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

export default router;