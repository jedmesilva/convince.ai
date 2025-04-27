// Servidor Node.js mínimo sem Express

import { createServer } from 'http';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  
  // Rota principal
  try {
    const indexPath = join(__dirname, 'index.html');
    const content = readFileSync(indexPath);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(content);
  } catch (e) {
    console.error('Erro ao ler arquivo index.html:', e);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Erro interno do servidor');
  }
});

// Iniciar o servidor na porta 5000
const PORT = 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
});