// Script para iniciar os servidores combinados (Express + Vite)
import { execSync } from 'child_process';

// Configurar ambiente
process.env.NODE_ENV = 'development';
console.log('Iniciando servidor combinado...');

try {
  // Executar o servidor stripe (combinado)
  execSync('node stripe-server.js', { 
    stdio: 'inherit',
    env: process.env
  });
} catch (error) {
  console.error('Erro ao iniciar o servidor combinado:', error);
  process.exit(1);
}