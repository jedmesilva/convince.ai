import { supabaseAdmin } from './supabase';

// Função para criar tabelas usando Supabase SQL direto
async function setupDatabase() {
  console.log('Configurando banco de dados...');
  
  try {
    // Primeiro, vamos criar as tabelas uma por uma usando insert/upsert para testar a conexão
    
    // Verificar se já existem tabelas
    const { data: tables, error: tablesError } = await supabaseAdmin
      .rpc('exec_sql', { 
        sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';" 
      });
    
    if (tablesError) {
      console.log('Tentando método alternativo para verificar tabelas...');
      
      // Método alternativo: tentar acessar uma tabela específica para verificar se existe
      const { error: testError } = await supabaseAdmin
        .from('convincers')
        .select('id')
        .limit(1);
      
      if (testError && testError.code === '42P01') {
        // Tabela não existe, vamos criá-la
        console.log('Tabelas não existem, criando...');
        await createTablesDirectly();
      } else if (!testError) {
        console.log('Tabelas já existem');
        await seedInitialData();
      } else {
        console.error('Erro ao verificar tabelas:', testError);
        throw testError;
      }
    } else {
      console.log('Tabelas encontradas:', tables);
      await seedInitialData();
    }
    
  } catch (error) {
    console.error('Erro ao configurar banco de dados:', error);
    throw error;
  }
}

async function createTablesDirectly() {
  console.log('Criando tabelas diretamente...');
  
  // Vamos usar uma abordagem mais simples: criar os dados mesmo que as tabelas não existam
  // O Supabase pode criar automaticamente algumas estruturas
  
  try {
    // Tentar inserir um convincer de teste
    const { data: testConvincer, error: convincerError } = await supabaseAdmin
      .from('convincers')
      .upsert({
        name: 'Usuario Teste',
        email: 'teste@exemplo.com',
        status: 'active'
      }, { onConflict: 'email' })
      .select()
      .single();

    if (convincerError) {
      console.log('Tabela convincers não existe, precisa ser criada no painel do Supabase');
      console.log('Erro:', convincerError);
      return false;
    }

    console.log('Tabela convincers funcional');
    
    // Tentar criar um prêmio inicial
    const { data: testPrize, error: prizeError } = await supabaseAdmin
      .from('prizes')
      .upsert({
        amount: 100.00,
        status: 'active'
      })
      .select()
      .single();

    if (prizeError) {
      console.log('Tabela prizes não existe, precisa ser criada no painel do Supabase');
      console.log('Erro:', prizeError);
      return false;
    }

    console.log('Tabela prizes funcional');
    return true;
    
  } catch (error) {
    console.error('Erro ao criar tabelas:', error);
    return false;
  }
}

async function seedInitialData() {
  console.log('Verificando dados iniciais...');
  
  try {
    // Verificar se existe prêmio ativo
    const { data: activePrize, error: prizeError } = await supabaseAdmin
      .from('prizes')
      .select('*')
      .eq('status', 'active')
      .single();

    if (prizeError || !activePrize) {
      // Criar prêmio inicial
      const { data: newPrize, error: newPrizeError } = await supabaseAdmin
        .from('prizes')
        .insert({
          amount: 100.00,
          status: 'active'
        })
        .select()
        .single();

      if (newPrizeError) {
        console.error('Erro ao criar prêmio inicial:', newPrizeError);
      } else {
        console.log('Prêmio inicial criado:', newPrize);
      }
    } else {
      console.log('Prêmio ativo encontrado:', activePrize);
    }

  } catch (error) {
    console.error('Erro ao criar dados iniciais:', error);
  }
}

// Função para mostrar instruções ao usuário
function showSetupInstructions() {
  console.log(`
===============================================
INSTRUÇÕES PARA CONFIGURAR O BANCO DE DADOS
===============================================

Para que a aplicação funcione, você precisa criar as tabelas no painel do Supabase:

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Vá para seu projeto
3. Clique em "SQL Editor" na sidebar
4. Execute os seguintes comandos SQL:

-- Tabela de convincers (usuários)
CREATE TABLE convincers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Tabela de prêmios
CREATE TABLE prizes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  amount NUMERIC(10, 2) NOT NULL,
  distributed_at TIMESTAMP,
  winner_convincer_id UUID REFERENCES convincers(id),
  status TEXT DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Tabela de tentativas
CREATE TABLE attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  convincer_id UUID NOT NULL REFERENCES convincers(id),
  status TEXT DEFAULT 'active' NOT NULL,
  available_time_seconds INTEGER DEFAULT 1800 NOT NULL,
  convincing_score INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Inserir prêmio inicial
INSERT INTO prizes (amount, status) VALUES (100.00, 'active');

5. Depois de executar esses comandos, reinicie o servidor da API

===============================================
  `);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase()
    .then((success) => {
      if (success) {
        console.log('Banco de dados configurado com sucesso!');
      } else {
        showSetupInstructions();
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('Falha na configuração:', error);
      showSetupInstructions();
      process.exit(1);
    });
}

export { setupDatabase, showSetupInstructions };