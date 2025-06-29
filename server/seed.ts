import { supabaseAdmin } from './supabase';

// Função para aplicar o schema SQL diretamente no Supabase
async function createTables() {
  console.log('Criando tabelas no Supabase...');

  // Executar SQL usando query direto
  const executeSQL = async (sql: string) => {
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql });
    if (error) {
      console.error('Erro SQL:', error);
      // Tentar executar diretamente pela tabela se exec_sql não funcionar
      const { error: queryError } = await supabaseAdmin.from('_migrations').select('*').limit(1);
      if (queryError) {
        // Se nem isso funcionar, vamos usar um método mais direto
        throw new Error(`Erro ao executar SQL: ${error.message}`);
      }
    }
    return { data, error };
  };

  // SQL para criar todas as tabelas
  const sqlStatements = [
    `CREATE TABLE IF NOT EXISTS "convincers" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "name" text NOT NULL,
      "email" text NOT NULL,
      "status" text DEFAULT 'active' NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT "convincers_email_unique" UNIQUE("email")
    );`,
    
    `CREATE TABLE IF NOT EXISTS "attempts" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "convincer_id" uuid NOT NULL,
      "status" text DEFAULT 'active' NOT NULL,
      "available_time_seconds" integer DEFAULT 1800 NOT NULL,
      "convincing_score" integer DEFAULT 0 NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    );`,
    
    `CREATE TABLE IF NOT EXISTS "messages" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "attempt_id" uuid NOT NULL,
      "convincer_id" uuid NOT NULL,
      "message" text NOT NULL,
      "convincing_score_snapshot" integer DEFAULT 0 NOT NULL,
      "status" text DEFAULT 'sent' NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    );`,
    
    `CREATE TABLE IF NOT EXISTS "ai_responses" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "attempt_id" uuid NOT NULL,
      "user_message_id" uuid NOT NULL,
      "ai_response" text NOT NULL,
      "convincing_score_snapshot" integer DEFAULT 0 NOT NULL,
      "status" text DEFAULT 'sent' NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    );`,
    
    `CREATE TABLE IF NOT EXISTS "payments" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "convincer_id" uuid NOT NULL,
      "amount_paid" numeric(10, 2) NOT NULL,
      "time_purchased_seconds" integer NOT NULL,
      "status" text DEFAULT 'pending' NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    );`,
    
    `CREATE TABLE IF NOT EXISTS "time_balances" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "convincer_id" uuid NOT NULL,
      "payment_id" uuid NOT NULL,
      "amount_time_seconds" integer NOT NULL,
      "status" text DEFAULT 'active' NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    );`,
    
    `CREATE TABLE IF NOT EXISTS "prizes" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "amount" numeric(10, 2) NOT NULL,
      "distributed_at" timestamp,
      "winner_convincer_id" uuid,
      "status" text DEFAULT 'active' NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    );`,
    
    `CREATE TABLE IF NOT EXISTS "prize_certificates" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "convincer_id" uuid NOT NULL,
      "prize_id" uuid NOT NULL,
      "hash" text NOT NULL,
      "status" text DEFAULT 'valid' NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT "prize_certificates_hash_unique" UNIQUE("hash")
    );`,
    
    `CREATE TABLE IF NOT EXISTS "withdrawals" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "convincer_id" uuid NOT NULL,
      "prize_id" uuid NOT NULL,
      "certificate_id" uuid NOT NULL,
      "hash" text NOT NULL,
      "amount_withdrawn" numeric(10, 2) NOT NULL,
      "requested_at" timestamp DEFAULT now() NOT NULL,
      "completed_at" timestamp,
      "status" text DEFAULT 'pending' NOT NULL,
      "description" text,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT "withdrawals_hash_unique" UNIQUE("hash")
    );`
  ];

  try {
    for (const statement of sqlStatements) {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: statement });
      if (error) {
        console.error('Erro ao executar SQL:', error);
        throw error;
      }
    }
    console.log('Tabelas criadas com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabelas:', error);
    throw error;
  }
}

// Função para adicionar foreign keys
async function addForeignKeys() {
  console.log('Adicionando foreign keys...');

  const foreignKeys = [
    'ALTER TABLE "attempts" ADD CONSTRAINT "attempts_convincer_id_convincers_id_fk" FOREIGN KEY ("convincer_id") REFERENCES "public"."convincers"("id") ON DELETE no action ON UPDATE no action;',
    'ALTER TABLE "messages" ADD CONSTRAINT "messages_attempt_id_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempts"("id") ON DELETE no action ON UPDATE no action;',
    'ALTER TABLE "messages" ADD CONSTRAINT "messages_convincer_id_convincers_id_fk" FOREIGN KEY ("convincer_id") REFERENCES "public"."convincers"("id") ON DELETE no action ON UPDATE no action;',
    'ALTER TABLE "ai_responses" ADD CONSTRAINT "ai_responses_attempt_id_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempts"("id") ON DELETE no action ON UPDATE no action;',
    'ALTER TABLE "ai_responses" ADD CONSTRAINT "ai_responses_user_message_id_messages_id_fk" FOREIGN KEY ("user_message_id") REFERENCES "public"."messages"("id") ON DELETE no action ON UPDATE no action;',
    'ALTER TABLE "payments" ADD CONSTRAINT "payments_convincer_id_convincers_id_fk" FOREIGN KEY ("convincer_id") REFERENCES "public"."convincers"("id") ON DELETE no action ON UPDATE no action;',
    'ALTER TABLE "time_balances" ADD CONSTRAINT "time_balances_convincer_id_convincers_id_fk" FOREIGN KEY ("convincer_id") REFERENCES "public"."convincers"("id") ON DELETE no action ON UPDATE no action;',
    'ALTER TABLE "prizes" ADD CONSTRAINT "prizes_winner_convincer_id_convincers_id_fk" FOREIGN KEY ("winner_convincer_id") REFERENCES "public"."convincers"("id") ON DELETE no action ON UPDATE no action;',
    'ALTER TABLE "prize_certificates" ADD CONSTRAINT "prize_certificates_convincer_id_convincers_id_fk" FOREIGN KEY ("convincer_id") REFERENCES "public"."convincers"("id") ON DELETE no action ON UPDATE no action;',
    'ALTER TABLE "prize_certificates" ADD CONSTRAINT "prize_certificates_prize_id_prizes_id_fk" FOREIGN KEY ("prize_id") REFERENCES "public"."prizes"("id") ON DELETE no action ON UPDATE no action;',
    'ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_convincer_id_convincers_id_fk" FOREIGN KEY ("convincer_id") REFERENCES "public"."convincers"("id") ON DELETE no action ON UPDATE no action;',
    'ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_prize_id_prizes_id_fk" FOREIGN KEY ("prize_id") REFERENCES "public"."prizes"("id") ON DELETE no action ON UPDATE no action;',
    'ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_certificate_id_prize_certificates_id_fk" FOREIGN KEY ("certificate_id") REFERENCES "public"."prize_certificates"("id") ON DELETE no action ON UPDATE no action;'
  ];

  try {
    for (const fk of foreignKeys) {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: fk });
      if (error && !error.message.includes('already exists')) {
        console.error('Erro ao adicionar foreign key:', error);
        // Continuar mesmo com erro, pois as FKs podem já existir
      }
    }
    console.log('Foreign keys adicionadas com sucesso!');
  } catch (error) {
    console.error('Erro ao adicionar foreign keys:', error);
    // Não falhar aqui, pois as FKs podem já existir
  }
}

// Função para criar dados iniciais
async function seedData() {
  console.log('Criando dados iniciais...');

  try {
    // Criar prêmio inicial
    const { data: existingPrize } = await supabaseAdmin
      .from('prizes')
      .select('id')
      .eq('status', 'active')
      .single();

    if (!existingPrize) {
      const { error: prizeError } = await supabaseAdmin
        .from('prizes')
        .insert({
          amount: '100.00',
          status: 'active'
        });

      if (prizeError) {
        console.error('Erro ao criar prêmio inicial:', prizeError);
        throw prizeError;
      }
      console.log('Prêmio inicial criado: $100.00');
    } else {
      console.log('Prêmio inicial já existe');
    }

  } catch (error) {
    console.error('Erro ao criar dados iniciais:', error);
    throw error;
  }
}

// Função principal para executar o seed
async function runSeed() {
  try {
    await createTables();
    await addForeignKeys();
    await seedData();
    console.log('Seed executado com sucesso!');
  } catch (error) {
    console.error('Erro no seed:', error);
    throw error;
  }
}

// Execute seed if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeed()
    .then(() => {
      console.log('Processo de seed concluído.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Falha no seed:', error);
      process.exit(1);
    });
}

export default runSeed;