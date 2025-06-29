import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  console.log('Conectando ao banco de dados...');
  const migrationClient = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationClient);

  try {
    console.log('Executando migrações...');
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('Migrações executadas com sucesso!');
  } catch (error) {
    console.error('Erro ao executar migrações:', error);
    throw error;
  } finally {
    await migrationClient.end();
  }
}

// Execute migrations if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => {
      console.log('Processo de migração concluído.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Falha na migração:', error);
      process.exit(1);
    });
}

export default runMigrations;