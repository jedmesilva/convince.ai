import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// In-memory storage for mock data
let stats = {
  totalAttempts: 127,
  successfulAttempts: 3,
  failedAttempts: 124,
  currentPrizeAmount: 150,
  successRate: "2.36"
};

let attempts = [
  { id: '1', status: 'failed', convincing_score: 2.5, created_at: new Date().toISOString(), convincers: { name: 'Ana Silva' } },
  { id: '2', status: 'failed', convincing_score: 1.8, created_at: new Date().toISOString(), convincers: { name: 'João Santos' } },
  { id: '3', status: 'success', convincing_score: 8.7, created_at: new Date().toISOString(), convincers: { name: 'Maria Costa' } },
];

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/prizes/current', (req, res) => {
  res.json({
    id: '1',
    amount: stats.currentPrizeAmount,
    status: 'active',
    created_at: new Date().toISOString()
  });
});

app.get('/api/prizes/statistics', (req, res) => {
  res.json(stats);
});

app.get('/api/attempts', (req, res) => {
  res.json(attempts);
});

app.post('/api/convincers', (req, res) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Nome e email são obrigatórios' });
  }

  const convincer = {
    id: uuidv4(),
    name,
    email,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  res.status(201).json(convincer);
});

app.post('/api/payments', (req, res) => {
  const { convincer_id, amount_paid, time_purchased_seconds } = req.body;
  
  if (!convincer_id || !amount_paid || !time_purchased_seconds) {
    return res.status(400).json({ error: 'Dados de pagamento incompletos' });
  }

  const payment = {
    id: uuidv4(),
    convincer_id,
    amount_paid,
    time_purchased_seconds,
    status: 'completed',
    created_at: new Date().toISOString()
  };

  const timeBalance = {
    id: uuidv4(),
    convincer_id,
    payment_id: payment.id,
    amount_time_seconds: time_purchased_seconds,
    status: 'active',
    created_at: new Date().toISOString()
  };

  res.status(201).json({
    payment,
    timeBalance,
    success: true
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor unificado rodando em http://0.0.0.0:${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
});