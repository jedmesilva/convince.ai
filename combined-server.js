// Servidor combinado que inicia o servidor na porta 5000 e proxeia as solicitações para o Vite em desenvolvimento

import { createServer } from 'http';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Iniciar o servidor Vite em segundo plano
console.log('Iniciando servidor Vite...');
const viteProcess = spawn('npx', ['vite'], {
  stdio: 'inherit',
  detached: true
});

// Verificar se o processo do Vite iniciou corretamente
viteProcess.on('error', (err) => {
  console.error('Erro ao iniciar o servidor Vite:', err);
  process.exit(1);
});

// Criar servidor HTTP
const server = createServer((req, res) => {
  const url = req.url;
  
  // Log da requisição
  console.log(`${req.method} ${url}`);
  
  // Rota para healthcheck
  if (url === '/api/healthcheck') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', message: 'Server is running' }));
    return;
  }
  
  // Rota para stats
  if (url === '/api/stats') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      prizeAmount: 10,
      failedAttempts: 5
    }));
    return;
  }
  
  // Redirecionar outras solicitações para o servidor Vite (rodando na porta 8080)
  res.writeHead(302, { 'Location': `http://localhost:8080${url}` });
  res.end();
});

// Iniciar o servidor na porta 5000
const PORT = 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor principal rodando em http://0.0.0.0:${PORT}`);
  console.log(`Redirecionando solicitações de frontend para http://localhost:8080`);
});