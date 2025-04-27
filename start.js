// Script para iniciar o servidor combinado
import { spawn } from 'child_process';

console.log('Iniciando o servidor combinado...');

// Iniciar o servidor combinado
const serverProcess = spawn('node', ['combined-server.js'], {
  stdio: 'inherit',
});

// Gerenciar eventos do processo
serverProcess.on('error', (err) => {
  console.error('Erro ao iniciar o servidor combinado:', err);
  process.exit(1);
});

serverProcess.on('close', (code) => {
  console.log(`Servidor combinado encerrado com código: ${code}`);
  process.exit(code);
});