import { pgTable, text, serial, integer, boolean, timestamp, real, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Tabelas que correspondem às do Supabase
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  email: text("email"),
  status: text("status").default("active"),
});

export const prizePool = pgTable("prize_pools", {
  id: serial("id").primaryKey(),
  amount: real("amount").notNull().default(0),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const persuasionAttempts = pgTable("persuasion_attempts", {
  id: serial("id").primaryKey(),
  user_id: uuid("user_id").references(() => users.id),
  created_at: timestamp("created_at").notNull().defaultNow(),
  session_id: text("session_id").notNull(),
  status: text("status").notNull().default("failed"),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  is_user: boolean("is_user").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  session_id: text("session_id").notNull(),
  attempt_id: integer("attempt_id").references(() => persuasionAttempts.id),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  user_id: uuid("user_id").references(() => users.id),
  session_id: text("session_id").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").notNull(),
  method: text("method"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const persuasionTimers = pgTable("persuasion_timers", {
  id: serial("id").primaryKey(),
  attempt_id: integer("attempt_id").references(() => persuasionAttempts.id),
  started_at: timestamp("started_at").notNull().defaultNow(),
  duration_seconds: integer("duration_seconds").notNull().default(300), // 5 minutos padrão
});

export const convincingLevels = pgTable("convincing_levels", {
  id: serial("id").primaryKey(),
  attempt_id: integer("attempt_id").references(() => persuasionAttempts.id),
  level: integer("level").notNull().default(0), // 0-100
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const withdrawals = pgTable("withdrawals", {
  id: serial("id").primaryKey(),
  user_id: uuid("user_id").references(() => users.id),
  amount: real("amount").notNull(),
  status: text("status").notNull().default("pending"),
  method: text("method").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  session_id: text("session_id").notNull(),
});

// Relações
export const usersRelations = relations(users, ({ many }) => ({
  attempts: many(persuasionAttempts),
  payments: many(payments),
  withdrawals: many(withdrawals),
}));

export const persuasionAttemptsRelations = relations(persuasionAttempts, ({ one, many }) => ({
  user: one(users, {
    fields: [persuasionAttempts.user_id],
    references: [users.id],
  }),
  messages: many(messages),
  timer: many(persuasionTimers),
  convincingLevel: many(convincingLevels),
}));

// Schemas para inserção
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  text: true,
  is_user: true,
  session_id: true,
  attempt_id: true,
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  user_id: true,
  session_id: true,
  amount: true,
  status: true,
  method: true,
});

export const insertPersuasionAttemptSchema = createInsertSchema(persuasionAttempts).pick({
  user_id: true,
  session_id: true,
  status: true,
});

export const insertWithdrawalSchema = createInsertSchema(withdrawals).pick({
  user_id: true,
  amount: true,
  method: true,
  session_id: true,
});

export const insertConvincingLevelSchema = createInsertSchema(convincingLevels).pick({
  attempt_id: true,
  level: true,
});

// Tipos
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export type InsertPersuasionAttempt = z.infer<typeof insertPersuasionAttemptSchema>;
export type PersuasionAttempt = typeof persuasionAttempts.$inferSelect;

export type InsertWithdrawal = z.infer<typeof insertWithdrawalSchema>;
export type Withdrawal = typeof withdrawals.$inferSelect;

export type InsertConvincingLevel = z.infer<typeof insertConvincingLevelSchema>;
export type ConvincingLevel = typeof convincingLevels.$inferSelect;

export type PrizePool = typeof prizePool.$inferSelect;
export type PersuasionTimer = typeof persuasionTimers.$inferSelect;
