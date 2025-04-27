#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// Verificar e criar diretório de migrações
async function ensureMigrationsDir() {
  try {
    await fs.mkdir('migrations', { recursive: true });
    console.log('✅ Diretório de migrações verificado/criado');
  } catch (error) {
    console.error('❌ Erro ao criar diretório de migrações:', error);
    process.exit(1);
  }
}

// Gerar a migração com drizzle-kit
async function generateMigration() {
  try {
    console.log('🔍 Gerando migração...');
    const { stdout, stderr } = await execAsync('npx drizzle-kit generate');
    
    console.log('✅ Migração gerada com sucesso');
    console.log(stdout);
    
    if (stderr) {
      console.warn('⚠️ Avisos durante a geração da migração:');
      console.warn(stderr);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao gerar migração:', error.message);
    return false;
  }
}

// Aplicar a migração no banco de dados
async function applyMigration() {
  try {
    console.log('🔄 Aplicando migração no banco de dados...');
    
    // Criar um arquivo temporário para aplicar a migração
    const migrationScript = `
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente se existirem
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não está definido');
  process.exit(1);
}

async function main() {
  console.log('🔌 Conectando ao banco de dados...');
  
  // Conexão SQL para migrações (precisa ser diferente da conexão normal)
  const migrationClient = postgres(DATABASE_URL, { max: 1 });
  
  try {
    console.log('🔄 Iniciando migração...');
    const db = drizzle(migrationClient);
    
    // Aplicar migrações de ./migrations
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('✅ Migração aplicada com sucesso');
  } catch (error) {
    console.error('❌ Erro ao aplicar migração:', error);
    process.exit(1);
  } finally {
    await migrationClient.end();
  }
}

main();
`;

    // Escrever o script em um arquivo temporário
    await fs.writeFile('temp-migrate.mjs', migrationScript);
    
    // Executar o script
    const { stdout, stderr } = await execAsync('node temp-migrate.mjs');
    console.log(stdout);
    
    if (stderr) {
      console.warn('⚠️ Avisos durante a aplicação da migração:');
      console.warn(stderr);
    }
    
    // Remover o arquivo temporário
    await fs.unlink('temp-migrate.mjs');
    
    console.log('✅ Migração aplicada com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao aplicar migração:', error.message);
    return false;
  }
}

// Função principal
async function main() {
  console.log('🚀 Iniciando sincronização do banco de dados...');
  
  // Verificar e criar diretório de migrações
  await ensureMigrationsDir();
  
  // Gerar migração
  const migrationGenerated = await generateMigration();
  if (!migrationGenerated) {
    console.error('❌ Falha ao gerar migração. Abortando.');
    process.exit(1);
  }
  
  // Aplicar migração
  const migrationApplied = await applyMigration();
  if (!migrationApplied) {
    console.error('❌ Falha ao aplicar migração. Verifique os logs para mais detalhes.');
    process.exit(1);
  }
  
  console.log('✅ Sincronização do banco de dados concluída com sucesso!');
}

// Executar o script
main().catch(error => {
  console.error('❌ Erro inesperado:', error);
  process.exit(1);
});