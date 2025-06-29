import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

// CORS middleware
app.use(cors({
  origin: '*', // Permitir todas as origens temporariamente para debug
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Current prize endpoint
app.get('/api/prizes/current', (req, res) => {
  res.json({
    id: uuidv4(),
    amount: 150.00,
    status: 'open',
    created_at: new Date().toISOString()
  });
});

// Prize statistics
app.get('/api/prizes/statistics', (req, res) => {
  res.json({
    totalAttempts: 127,
    successfulAttempts: 3,
    failedAttempts: 124,
    currentPrizeAmount: 150.00,
    successRate: '2.36'
  });
});

// Create convincer
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

// Get attempts
app.get('/api/attempts', (req, res) => {
  const mockAttempts = [
    {
      id: uuidv4(),
      status: 'failed',
      convincing_score: 23,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      convincers: { name: 'Ana Silva' }
    },
    {
      id: uuidv4(),
      status: 'failed',
      convincing_score: 67,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      convincers: { name: 'João Santos' }
    },
    {
      id: uuidv4(),
      status: 'completed',
      convincing_score: 98,
      created_at: new Date(Date.now() - 10800000).toISOString(),
      convincers: { name: 'Maria Costa' }
    }
  ];
  
  res.json(mockAttempts);
});

// Process payment
app.post('/api/payments', (req, res) => {
  const { convincer_id, amount_paid, time_purchased_seconds } = req.body;
  
  if (!convincer_id || !amount_paid || !time_purchased_seconds) {
    return res.status(400).json({ 
      error: 'Dados obrigatórios: convincer_id, amount_paid, time_purchased_seconds' 
    });
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

  res.json({
    payment,
    timeBalance,
    success: true
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'AI Prize Persuader API Server',
    status: 'running',
    endpoints: {
      health: 'GET /api/health',
      currentPrize: 'GET /api/prizes/current',
      statistics: 'GET /api/prizes/statistics',
      convincers: 'POST /api/convincers',
      attempts: 'GET /api/attempts',
      payments: 'POST /api/payments'
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
});