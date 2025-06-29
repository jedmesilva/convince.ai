import { pgTable, text, uuid, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Convincers table - users who try to convince the AI
export const convincers = pgTable("convincers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  status: text("status").notNull().default("active"), // active, inactive, banned
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// Attempts table - each persuasion attempt
export const attempts = pgTable("attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  convincer_id: uuid("convincer_id").notNull().references(() => convincers.id),
  status: text("status").notNull().default("active"), // active, completed, failed, abandoned
  available_time_seconds: integer("available_time_seconds").notNull().default(1800), // 30 minutes
  convincing_score: integer("convincing_score").notNull().default(0), // 0-100
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// Messages table - user messages in attempts
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  attempt_id: uuid("attempt_id").notNull().references(() => attempts.id),
  convincer_id: uuid("convincer_id").notNull().references(() => convincers.id),
  message: text("message").notNull(),
  convincing_score_snapshot: integer("convincing_score_snapshot").notNull().default(0),
  status: text("status").notNull().default("sent"), // sent, read, processed
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// AI Responses table - AI responses to user messages
export const ai_responses = pgTable("ai_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  attempt_id: uuid("attempt_id").notNull().references(() => attempts.id),
  user_message_id: uuid("user_message_id").notNull().references(() => messages.id),
  ai_response: text("ai_response").notNull(),
  convincing_score_snapshot: integer("convincing_score_snapshot").notNull().default(0),
  status: text("status").notNull().default("sent"), // sent, read
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// Time Balances table - unique balance per user
export const time_balances = pgTable("time_balances", {
  id: uuid("id").primaryKey().defaultRandom(),
  convincer_id: uuid("convincer_id").notNull().references(() => convincers.id).unique(), // único por usuário
  total_time_seconds: integer("total_time_seconds").notNull().default(0), // saldo total acumulado
  status: text("status").notNull().default("active"), // active, suspended
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// Payments table - payment records
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  convincer_id: uuid("convincer_id").notNull().references(() => convincers.id),
  amount_paid: decimal("amount_paid", { precision: 10, scale: 2 }).notNull(),
  time_purchased_seconds: integer("time_purchased_seconds").notNull(),
  status: text("status").notNull().default("pending"), // pending, completed, failed, refunded
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// Prizes table - prize pool management
export const prizes = pgTable("prizes", {
  id: uuid("id").primaryKey().defaultRandom(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  distributed_at: timestamp("distributed_at"),
  winner_convincer_id: uuid("winner_convincer_id").references(() => convincers.id),
  status: text("status").notNull().default("open"), // open, distributed, cancelled
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// Prize Certificates table - proof of prize winning
export const prize_certificates = pgTable("prize_certificates", {
  id: uuid("id").primaryKey().defaultRandom(),
  convincer_id: uuid("convincer_id").notNull().references(() => convincers.id),
  prize_id: uuid("prize_id").notNull().references(() => prizes.id),
  hash: text("hash").notNull().unique(), // Cryptographic hash for verification
  status: text("status").notNull().default("valid"), // valid, revoked, claimed
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// Withdrawals table - prize withdrawal requests
export const withdrawals = pgTable("withdrawals", {
  id: uuid("id").primaryKey().defaultRandom(),
  convincer_id: uuid("convincer_id").notNull().references(() => convincers.id),
  prize_id: uuid("prize_id").notNull().references(() => prizes.id),
  certificate_id: uuid("certificate_id").notNull().references(() => prize_certificates.id),
  hash: text("hash").notNull().unique(),
  amount_withdrawn: decimal("amount_withdrawn", { precision: 10, scale: 2 }).notNull(),
  requested_at: timestamp("requested_at").notNull().defaultNow(),
  completed_at: timestamp("completed_at"),
  status: text("status").notNull().default("pending"), // pending, approved, completed, rejected
  description: text("description"),  
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schemas
export const insertConvincerSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

export const insertAttemptSchema = z.object({
  convincer_id: z.string().uuid(),
  available_time_seconds: z.number().optional(),
});

export const insertMessageSchema = z.object({
  attempt_id: z.string().uuid(),
  convincer_id: z.string().uuid(),
  message: z.string(),
});

export const insertAiResponseSchema = z.object({
  attempt_id: z.string().uuid(),
  user_message_id: z.string().uuid(),
  ai_response: z.string(),
});

export const insertPaymentSchema = z.object({
  convincer_id: z.string().uuid(),
  amount_paid: z.string(),
  time_purchased_seconds: z.number(),
});

export const insertTimeBalanceSchema = z.object({
  convincer_id: z.string().uuid(),
  payment_id: z.string().uuid(),
  amount_time_seconds: z.number(),
});

export const insertPrizeSchema = z.object({
  amount: z.string(),
});

export const insertPrizeCertificateSchema = z.object({
  convincer_id: z.string().uuid(),
  prize_id: z.string().uuid(),
  hash: z.string(),
});

export const insertWithdrawalSchema = z.object({
  convincer_id: z.string().uuid(),
  prize_id: z.string().uuid(),
  certificate_id: z.string().uuid(),
  hash: z.string(),
  amount_withdrawn: z.string(),
  description: z.string().optional(),
});

// Types
export type InsertConvincer = z.infer<typeof insertConvincerSchema>;
export type Convincer = typeof convincers.$inferSelect;

export type InsertAttempt = z.infer<typeof insertAttemptSchema>;
export type Attempt = typeof attempts.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertAiResponse = z.infer<typeof insertAiResponseSchema>;
export type AiResponse = typeof ai_responses.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export type InsertTimeBalance = z.infer<typeof insertTimeBalanceSchema>;
export type TimeBalance = typeof time_balances.$inferSelect;

export type InsertPrize = z.infer<typeof insertPrizeSchema>;
export type Prize = typeof prizes.$inferSelect;

export type InsertPrizeCertificate = z.infer<typeof insertPrizeCertificateSchema>;
export type PrizeCertificate = typeof prize_certificates.$inferSelect;

export type InsertWithdrawal = z.infer<typeof insertWithdrawalSchema>;
export type Withdrawal = typeof withdrawals.$inferSelect;
