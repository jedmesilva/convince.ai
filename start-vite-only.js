#!/usr/bin/env node

/**
 * Script para iniciar apenas o frontend Vite
 * Isso evita a dependência do servidor Express que não está funcionando no ambiente Replit
 */

import { spawn } from 'child_process';
import path from 'path';

console.log('Iniciando apenas o frontend Vite na porta 8080');

// Inicia apenas o Vite sem tentar iniciar o servidor Express
const viteProcess = spawn('npx', ['vite'], {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: {
    ...process.env,
    PORT: 8080,
    HOST: '0.0.0.0'
  }
});

viteProcess.on('error', (err) => {
  console.error('Erro ao iniciar o Vite:', err);
  process.exit(1);
});

viteProcess.on('exit', (code) => {
  console.log(`Processo Vite encerrado com código ${code}`);
  process.exit(code);
});

// Captura sinais para encerrar o processo corretamente
process.on('SIGINT', () => {
  console.log('Encerrando aplicação...');
  viteProcess.kill();
});

process.on('SIGTERM', () => {
  console.log('Encerrando aplicação...');
  viteProcess.kill();
});

console.log('Frontend Vite iniciado. Abra http://localhost:8080/ no navegador.');