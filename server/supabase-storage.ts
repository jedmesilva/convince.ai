import { 
  users,
  messages,
  payments,
  prizePool,
  persuasionAttempts,
  convincingLevels,
  withdrawals,
  type User,
  type InsertUser,
  type Message,
  type InsertMessage,
  type Payment,
  type InsertPayment,
  type InsertPersuasionAttempt,
  type InsertWithdrawal,
  type PrizePool,
  type PersuasionAttempt,
  type ConvincingLevel
} from "../shared/schema";

import { supabaseAdmin, supabaseAnon } from "./supabase";
import { db } from "./db";
import { and, asc, desc, eq, gt, gte, sql } from "drizzle-orm";
import { IStorage } from "./storage";
import { randomUUID } from "crypto";

export class SupabaseStorage implements IStorage {
  
  // Métodos de usuário
  async getUser(id: number): Promise<User | undefined> {
    try {
      // Utilizando o Drizzle ORM para buscar o usuário
      const [user] = await db.select().from(users).where(eq(users.id, id.toString()));
      return user;
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      // Utilizando o Drizzle ORM para buscar o usuário por username
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error("Erro ao buscar usuário por username:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // Utilizando o Drizzle ORM para criar um usuário
      const [user] = await db.insert(users).values({
        id: randomUUID(),
        username: insertUser.username,
        password: insertUser.password,
        created_at: new Date()
      }).returning();
      
      return user;
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      throw new Error(`Falha ao criar usuário: ${error.message}`);
    }
  }

  // Métodos de mensagens
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    try {
      // Usando Drizzle ORM para criação de mensagem
      const [message] = await db.insert(messages).values({
        text: insertMessage.text,
        is_user: insertMessage.is_user,
        session_id: insertMessage.session_id,
        attempt_id: insertMessage.attempt_id || null,
        timestamp: new Date()
      }).returning();
      
      return message;
    } catch (error) {
      console.error("Erro ao criar mensagem:", error);
      throw new Error(`Falha ao criar mensagem: ${error.message}`);
    }
  }

  async getMessagesBySessionId(sessionId: string): Promise<Message[]> {
    try {
      // Usando Drizzle ORM para buscar mensagens por session_id
      const messagesResult = await db.select()
        .from(messages)
        .where(eq(messages.session_id, sessionId))
        .orderBy(asc(messages.timestamp));
      
      return messagesResult;
    } catch (error) {
      console.error("Erro ao buscar mensagens:", error);
      return [];
    }
  }

  // Métodos de pagamentos
  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    try {
      // Usando transação para garantir que tanto o pagamento quanto 
      // a atualização do prêmio sejam realizados ou nenhum
      return await db.transaction(async (tx) => {
        // Criar o pagamento
        const [payment] = await tx.insert(payments).values({
          session_id: insertPayment.session_id,
          amount: insertPayment.amount,
          status: insertPayment.status,
          method: insertPayment.method || null,
          user_id: insertPayment.user_id || null,
          timestamp: new Date()
        }).returning();
        
        // Buscar prize pool atual
        const [currentPrize] = await tx.select().from(prizePool).limit(1);
        
        if (currentPrize) {
          // Atualizar o prêmio total
          await tx.update(prizePool)
            .set({ 
              amount: currentPrize.amount + insertPayment.amount,
              updated_at: new Date()
            })
            .where(eq(prizePool.id, currentPrize.id));
        } else {
          // Criar o primeiro registro no prize pool
          await tx.insert(prizePool).values({
            amount: insertPayment.amount,
            updated_at: new Date()
          });
        }
        
        return payment;
      });
    } catch (error) {
      console.error("Erro ao criar pagamento:", error);
      throw new Error(`Falha ao criar pagamento: ${error.message}`);
    }
  }

  async getPaymentsBySessionId(sessionId: string): Promise<Payment[]> {
    try {
      // Usando Drizzle ORM para buscar pagamentos por session_id
      const paymentsResults = await db.select()
        .from(payments)
        .where(eq(payments.session_id, sessionId))
        .orderBy(asc(payments.timestamp));
      
      return paymentsResults;
    } catch (error) {
      console.error("Erro ao buscar pagamentos:", error);
      return [];
    }
  }
  
  async getAllPayments(): Promise<Payment[]> {
    try {
      // Usando Drizzle ORM para buscar todos os pagamentos
      const paymentsResults = await db.select()
        .from(payments)
        .orderBy(desc(payments.timestamp));
      
      return paymentsResults;
    } catch (error) {
      console.error("Erro ao buscar todos os pagamentos:", error);
      return [];
    }
  }

  // Métodos de estatísticas e prêmios
  async getFailedAttemptsCount(): Promise<number> {
    try {
      // Utilizando SQL bruto via Drizzle para contagem mais eficiente
      const result = await db.execute(
        sql`SELECT COUNT(*) as count FROM persuasion_attempts WHERE status = 'failed'`
      );
      
      return result[0]?.count || 0;
    } catch (error) {
      console.error("Erro ao buscar número de tentativas falhas:", error);
      return 0;
    }
  }

  async getPrizeAmount(): Promise<number> {
    try {
      // Buscando o primeiro registro do prize pool
      const [prize] = await db.select().from(prizePool).limit(1);
      
      if (!prize) {
        // Se não existir, criar o primeiro registro
        const [newPrize] = await db.insert(prizePool).values({
          amount: 5000, // Valor inicial em dólares
          updated_at: new Date()
        }).returning();
        
        return newPrize.amount;
      }
      
      return prize.amount;
    } catch (error) {
      console.error("Erro ao buscar valor do prêmio:", error);
      return 5000; // Valor default em caso de erro
    }
  }

  // Incrementar o número de tentativas falhas
  async incrementFailedAttempts(): Promise<number> {
    try {
      // Usando transação para garantir que todas as operações sejam completadas ou nenhuma
      return await db.transaction(async (tx) => {
        // Criar uma nova tentativa falha
        const [attempt] = await tx.insert(persuasionAttempts).values({
          session_id: `session_${Date.now()}`,
          status: 'failed',
          created_at: new Date()
        }).returning();
        
        // Buscar prize pool atual
        const [currentPrize] = await tx.select().from(prizePool).limit(1);
        
        if (currentPrize) {
          // Incrementar o prêmio em $1
          await tx.update(prizePool)
            .set({ 
              amount: currentPrize.amount + 1,
              updated_at: new Date()
            })
            .where(eq(prizePool.id, currentPrize.id));
        } else {
          // Criar o primeiro registro no prize pool
          await tx.insert(prizePool).values({
            amount: 5001, // 5000 inicial + 1 por esta tentativa
            updated_at: new Date()
          });
        }
        
        // Contar o número total de tentativas falhas
        const result = await tx.execute(
          sql`SELECT COUNT(*) as count FROM persuasion_attempts WHERE status = 'failed'`
        );
        
        return result[0]?.count || 0;
      });
    } catch (error) {
      console.error("Erro ao incrementar tentativas falhas:", error);
      throw new Error(`Falha ao incrementar tentativas: ${error.message}`);
    }
  }

  // Método para sacar o prêmio
  async withdrawPrize(sessionId: string, method: string): Promise<Payment> {
    try {
      // Usar transação para garantir atomicidade
      return await db.transaction(async (tx) => {
        // Obter valor atual do prêmio
        const [currentPrize] = await tx.select().from(prizePool).limit(1);
        
        if (!currentPrize) {
          throw new Error("Prize pool não encontrado");
        }
        
        const prizeAmount = currentPrize.amount;
        
        // Zerar o valor do prêmio
        await tx.update(prizePool)
          .set({ 
            amount: 0,
            updated_at: new Date()
          })
          .where(eq(prizePool.id, currentPrize.id));
        
        // Criar registro de saque
        const [withdrawal] = await tx.insert(withdrawals).values({
          session_id: sessionId,
          amount: prizeAmount,
          method: method,
          status: 'pending',
          created_at: new Date()
        }).returning();
        
        // Retornar como um Payment para compatibilidade com a interface
        return {
          id: withdrawal.id,
          session_id: withdrawal.session_id,
          amount: withdrawal.amount,
          status: withdrawal.status,
          method: withdrawal.method,
          timestamp: withdrawal.created_at,
          user_id: withdrawal.user_id
        };
      });
    } catch (error) {
      console.error("Erro ao processar saque:", error);
      throw new Error(`Falha ao processar saque: ${error.message}`);
    }
  }
  
  // Método para criar tentativa de persuasão
  async createPersuasionAttempt(insertAttempt: InsertPersuasionAttempt): Promise<PersuasionAttempt> {
    try {
      // Criar tentativa usando Drizzle ORM
      const [attempt] = await db.insert(persuasionAttempts).values({
        user_id: insertAttempt.user_id || null,
        session_id: insertAttempt.session_id,
        status: insertAttempt.status || 'failed',
        created_at: new Date()
      }).returning();
      
      return attempt;
    } catch (error) {
      console.error("Erro ao criar tentativa de persuasão:", error);
      throw new Error(`Falha ao criar tentativa: ${error.message}`);
    }
  }
  
  // Método para atualizar nível de convencimento
  async updateConvincingLevel(attemptId: number, level: number): Promise<void> {
    try {
      // Verificar se já existe um registro para esta tentativa
      const [existingLevel] = await db.select()
        .from(convincingLevels)
        .where(eq(convincingLevels.attempt_id, attemptId));
      
      if (existingLevel) {
        // Atualizar registro existente
        await db.update(convincingLevels)
          .set({
            level,
            updated_at: new Date()
          })
          .where(eq(convincingLevels.id, existingLevel.id));
      } else {
        // Criar novo registro
        await db.insert(convincingLevels).values({
          attempt_id: attemptId,
          level,
          updated_at: new Date()
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar nível de convencimento:", error);
      throw new Error(`Falha ao atualizar nível: ${error.message}`);
    }
  }
  
  // Método para obter o nível de convencimento atual
  async getConvincingLevel(attemptId: number): Promise<number> {
    try {
      // Buscar o nível mais recente
      const [level] = await db.select()
        .from(convincingLevels)
        .where(eq(convincingLevels.attempt_id, attemptId))
        .orderBy(desc(convincingLevels.updated_at))
        .limit(1);
      
      return level?.level || 0;
    } catch (error) {
      console.error("Erro ao buscar nível de convencimento:", error);
      return 0;
    }
  }
  
  // Métodos adicionais para funcionalidades específicas
  
  // Obter tentativas de persuasão por usuário
  async getPersuasionAttemptsByUserId(userId: string): Promise<PersuasionAttempt[]> {
    try {
      const attempts = await db.select()
        .from(persuasionAttempts)
        .where(eq(persuasionAttempts.user_id, userId))
        .orderBy(desc(persuasionAttempts.created_at));
      
      return attempts;
    } catch (error) {
      console.error("Erro ao buscar tentativas de persuasão por usuário:", error);
      return [];
    }
  }
  
  // Obter histórico de saques
  async getWithdrawalHistory(sessionId: string): Promise<Payment[]> {
    try {
      const withdrawalsResult = await db.select()
        .from(withdrawals)
        .where(eq(withdrawals.session_id, sessionId))
        .orderBy(desc(withdrawals.created_at));
      
      // Converter para o tipo Payment
      return withdrawalsResult.map(w => ({
        id: w.id,
        session_id: w.session_id,
        amount: w.amount,
        status: w.status,
        method: w.method,
        timestamp: w.created_at,
        user_id: w.user_id
      }));
    } catch (error) {
      console.error("Erro ao buscar histórico de saques:", error);
      return [];
    }
  }
  
  // Obter o último nível de convencimento para um sessão
  async getLatestConvincingLevelBySessionId(sessionId: string): Promise<number> {
    try {
      // Primeiro, encontrar a tentativa mais recente para esta sessão
      const [latestAttempt] = await db.select()
        .from(persuasionAttempts)
        .where(eq(persuasionAttempts.session_id, sessionId))
        .orderBy(desc(persuasionAttempts.created_at))
        .limit(1);
        
      if (!latestAttempt) return 0;
      
      // Agora, obter o nível mais recente para esta tentativa
      return await this.getConvincingLevel(latestAttempt.id);
    } catch (error) {
      console.error("Erro ao buscar nível de convencimento por sessão:", error);
      return 0;
    }
  }
}