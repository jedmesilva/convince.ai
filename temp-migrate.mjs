
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
