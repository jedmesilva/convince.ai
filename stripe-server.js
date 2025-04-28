// Servidor combinado que inicia o servidor Express e o Vite juntos
// e implementa rotas de pagamento com Stripe
import { spawn } from 'child_process';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { createServer } from 'http';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Definir variáveis globais
const PORT = 5000;
const VITE_PORT = 8080;

// Iniciar o servidor Vite em segundo plano
console.log('Iniciando servidor Vite...');
const viteProcess = spawn('npx', ['vite'], {
  stdio: 'inherit',
  detached: false,
  env: {
    ...process.env,
    PORT: VITE_PORT.toString(),
    VITE_STRIPE_PUBLIC_KEY: process.env.VITE_STRIPE_PUBLIC_KEY
  }
});

// Verificar se o processo do Vite iniciou corretamente
viteProcess.on('error', (err) => {
  console.error('Erro ao iniciar o servidor Vite:', err);
  process.exit(1);
});

// Criar aplicação Express
const app = express();

// Configurações de middleware
app.use(express.json());
app.use(cors());

// Inicializar Stripe se a chave estiver disponível
let stripe;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  });
  console.log('Stripe inicializado com sucesso');
} else {
  console.warn('STRIPE_SECRET_KEY não encontrada, operações de pagamento serão simuladas');
}

// ==============================================
// ROTAS DA API
// ==============================================

// Rota de healthcheck
app.get('/api/healthcheck', (req, res) => {
  const stripeStatus = stripe ? 'connected' : 'not connected';
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    stripe: stripeStatus,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      hasStripePublicKey: !!process.env.VITE_STRIPE_PUBLIC_KEY
    }
  });
});

// Rota para estatísticas
app.get('/api/stats', (req, res) => {
  res.json({ 
    prizeAmount: 10,
    failedAttempts: 5
  });
});

// Rota para criar intenção de pagamento
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount } = req.body;
    console.log(`Criando payment intent para valor: ${amount}`);
    
    if (stripe) {
      // Usando Stripe real
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Converter para centavos
        currency: 'brl',
      });
      
      console.log('Payment intent criado com sucesso:', paymentIntent.id);
      
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } else {
      // Simulação de resposta
      const simulatedSecret = `pi_sim_${Date.now()}_secret_${Math.random().toString(36).substring(2, 10)}`;
      const simulatedId = `pi_sim_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      
      console.log('Payment intent simulado criado:', simulatedId);
      
      res.json({ 
        clientSecret: simulatedSecret,
        paymentIntentId: simulatedId
      });
    }
  } catch (error) {
    console.error('Erro ao criar payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rota de pagamento (legado, para compatibilidade)
app.post('/api/payment', async (req, res) => {
  console.log('Recebido pagamento:', req.body);
  
  try {
    // Extrair informações da requisição
    const { amount, session_id, method, status, user_id } = req.body;
    
    // Se temos o Stripe configurado e não estamos em modo de simulação
    if (stripe && method !== 'simulation') {
      try {
        // Criar um cliente se não existir
        const customerName = `Cliente ${session_id.substring(0, 8)}`;
        const customer = await stripe.customers.create({
          name: customerName,
          metadata: {
            session_id,
            user_id: user_id || 'anonymous'
          }
        });
        
        // Criar um PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Converter para centavos
          currency: 'brl',
          customer: customer.id,
          payment_method_types: ['card'],
          metadata: {
            session_id,
            payment_method: method
          }
        });
        
        // Registrar o pagamento no sistema
        console.log('Pagamento Stripe processado com sucesso:', paymentIntent.id);
        
        res.json({ 
          success: true, 
          message: 'Pagamento processado com Stripe',
          session_id,
          payment_id: paymentIntent.id
        });
      } catch (stripeError) {
        console.error('Erro no Stripe:', stripeError);
        throw new Error(`Erro no processamento Stripe: ${stripeError.message}`);
      }
    } else {
      // Modo de simulação (sem Stripe)
      console.log('Processando pagamento simulado');
      
      // Gerar ID de pagamento simulado
      const paymentId = `pay_sim_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      
      // Registrar o pagamento simulado no sistema
      console.log('Pagamento simulado criado:', paymentId);
      
      res.json({ 
        success: true, 
        message: 'Pagamento simulado processado com sucesso',
        session_id,
        payment_id: paymentId
      });
    }
  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    res.status(500).json({ 
      success: false, 
      message: `Erro ao processar pagamento: ${error.message}` 
    });
  }
});

// ==============================================
// PROXY PARA O VITE (FRONTEND)
// ==============================================

// Proxy para o servidor Vite
const viteProxy = createProxyMiddleware({
  target: `http://localhost:${VITE_PORT}`,
  changeOrigin: true,
  ws: true,
  logLevel: 'warn'
});

// Redirecionar todas as outras requisições para o Vite
app.use('/', viteProxy);

// Criar e iniciar o servidor HTTP
const server = createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n=== SERVIDOR COMBINADO ===`);
  console.log(`Servidor rodando em: http://0.0.0.0:${PORT}`);
  console.log(`API acessível em: http://0.0.0.0:${PORT}/api/`);
  console.log(`Frontend Vite em: http://localhost:${VITE_PORT}`);
  console.log(`Frontend via proxy: http://0.0.0.0:${PORT}`);
  console.log(`Stripe: ${stripe ? 'CONECTADO' : 'SIMULADO'}`);
  console.log(`==============================\n`);
});

// Lidar com saída limpa
process.on('SIGINT', () => {
  console.log('\nEncerrando servidores...');
  
  if (viteProcess && viteProcess.pid) {
    try {
      process.kill(-viteProcess.pid);
    } catch (err) {
      console.log('Erro ao finalizar processo Vite:', err);
    }
  }
  
  process.exit(0);
});