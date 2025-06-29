import express from 'express';
import cors from 'cors';
import simpleApiRoutes from './simpleApiRoutes';

const app = express();
const PORT = process.env.API_PORT || 3001;

// CORS middleware
app.use(cors({
  origin: ['http://localhost:5000', 'http://localhost:8080', 'http://localhost:3000'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`API ${req.method} ${path} ${res.statusCode} in ${duration}ms`);
  });
  
  next();
});

// API routes
app.use('/api', simpleApiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'AI Prize Persuader API Server',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      convincers: 'POST /api/convincers',
      prizes: 'GET /api/prizes/current',
      statistics: 'GET /api/prizes/statistics',
      attempts: 'GET /api/attempts',
      payments: 'POST /api/payments'
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API Server running on http://0.0.0.0:${PORT}`);
  console.log(`📋 API Documentation available at http://localhost:${PORT}`);
});

export default app;