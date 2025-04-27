// Script para iniciar o servidor da aplicação
// Este script executa o arquivo server.js

import { spawn } from 'child_process';

console.log('Iniciando o servidor da aplicação...');

// Iniciar o servidor usando node para executar o arquivo JavaScript
const serverProcess = spawn('node', ['server.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development'
  }
});

// Manipular eventos do processo
serverProcess.on('error', (err) => {
  console.error('Erro ao iniciar o servidor:', err);
  process.exit(1);
});

serverProcess.on('close', (code) => {
  console.log(`Servidor encerrado com código: ${code}`);
  process.exit(code);
});