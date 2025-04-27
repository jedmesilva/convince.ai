// Script para iniciar o servidor
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração do ambiente
process.env.NODE_ENV = 'development';

// Comando para iniciar o servidor TypeScript
const command = 'npx';
const args = ['ts-node', '--esm', 'server/index.ts'];

console.log(`Iniciando servidor: ${command} ${args.join(' ')}`);

// Iniciar o processo
const serverProcess = spawn(command, args, {
  stdio: 'inherit',
  env: {
    ...process.env,
    TS_NODE_TRANSPILE_ONLY: 'true' // Para melhor performance
  }
});

// Gerenciar eventos do processo
serverProcess.on('error', (err) => {
  console.error('Erro ao iniciar o servidor:', err);
  process.exit(1);
});

serverProcess.on('close', (code) => {
  console.log(`Servidor encerrado com código: ${code}`);
  process.exit(code);
});