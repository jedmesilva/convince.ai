// Servidor combinado que inicia o servidor Express e o Vite juntos
import { spawn } from 'child_process';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { createServer } from 'http';
import Stripe from 'stripe';

// Iniciar o servidor Vite em segundo plano
console.log('Iniciando servidor Vite...');
const viteProcess = spawn('npx', ['vite'], {
  stdio: 'inherit',
  detached: false
});

// Verificar se o processo do Vite iniciou corretamente
viteProcess.on('error', (err) => {
  console.error('Erro ao iniciar o servidor Vite:', err);
  process.exit(1);
});

// Criar aplicação Express
const app = express();

// Proxies para o servidor Vite
const viteProxy = createProxyMiddleware({
  target: 'http://localhost:8080',
  changeOrigin: true,
  ws: true,
  logLevel: 'warn'
});

// Processar requisições de API 
app.use(express.json());

// Rota para healthcheck
app.get('/api/healthcheck', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Rota simples para testar API
app.get('/api/stats', (req, res) => {
  res.json({ 
    prizeAmount: 10,
    failedAttempts: 5
  });
});

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

// Rota para criar intenção de pagamento
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (stripe) {
      // Usando Stripe real
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Converter para centavos
        currency: 'brl',
      });
      
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } else {
      // Simulação de resposta
      res.json({ 
        clientSecret: `pi_sim_${Date.now()}_secret_${Math.random().toString(36).substring(2, 10)}`,
        paymentIntentId: `pi_sim_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
      });
    }
  } catch (error) {
    console.error('Erro ao criar payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rota de pagamento com Stripe (legado, mantida para compatibilidade)
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
        
        // Registrar o pagamento no banco de dados aqui
        
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
      
      // Registrar o pagamento simulado no banco de dados aqui
      
      res.json({ 
        success: true, 
        message: 'Pagamento simulado processado com sucesso',
        session_id,
        payment_id: `pay_sim_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
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

// Proxies para o Vite (para servir assets e frontend)
app.use('/', viteProxy);

// Criar e iniciar o servidor HTTP
const server = createServer(app);
const PORT = 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor combinado rodando em http://0.0.0.0:${PORT}`);
  console.log(`API acessível em http://0.0.0.0:${PORT}/api/`);
  console.log(`Frontend servido do Vite em http://localhost:8080 e acessível via proxy em http://0.0.0.0:${PORT}`);
});

// Lidar com saída limpa
process.on('SIGINT', () => {
  console.log('Encerrando servidores...');
  
  if (viteProcess) {
    process.kill(-viteProcess.pid);
  }
  
  process.exit(0);
});