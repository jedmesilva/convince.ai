import { 
  users, 
  messages, 
  payments, 
  type User, 
  type InsertUser, 
  type Message, 
  type InsertMessage,
  type Payment,
  type InsertPayment
} from "../shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Message methods
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesBySessionId(sessionId: string): Promise<Message[]>;
  
  // Payment methods
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsBySessionId(sessionId: string): Promise<Payment[]>;
  getAllPayments(): Promise<Payment[]>;
  
  // Stats & Prize
  getFailedAttemptsCount(): Promise<number>;
  getPrizeAmount(): Promise<number>;
  withdrawPrize(sessionId: string, method: string): Promise<Payment>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private messagesData: Map<number, Message>;
  private paymentsData: Map<number, Payment>;
  private userCurrentId: number;
  private messageCurrentId: number;
  private paymentCurrentId: number;
  private failedAttempts: number;
  private prizeAmount: number;

  constructor() {
    this.users = new Map();
    this.messagesData = new Map();
    this.paymentsData = new Map();
    this.userCurrentId = 1;
    this.messageCurrentId = 1;
    this.paymentCurrentId = 1;
    this.failedAttempts = 540; // Initial failed attempts
    this.prizeAmount = 5401; // Initial prize amount in $
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      created_at: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageCurrentId++;
    const timestamp = new Date();
    const message: Message = { ...insertMessage, id, timestamp };
    this.messagesData.set(id, message);
    return message;
  }

  async getMessagesBySessionId(sessionId: string): Promise<Message[]> {
    return Array.from(this.messagesData.values())
      .filter(message => message.session_id === sessionId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = this.paymentCurrentId++;
    const timestamp = new Date();
    // Ensure method is not undefined
    const payment = { 
      ...insertPayment, 
      id, 
      timestamp,
      method: insertPayment.method || null
    } as Payment;
    
    this.paymentsData.set(id, payment);
    
    // Increment prize amount for each payment
    this.prizeAmount += insertPayment.amount;
    
    return payment;
  }

  async getPaymentsBySessionId(sessionId: string): Promise<Payment[]> {
    return Array.from(this.paymentsData.values())
      .filter(payment => payment.session_id === sessionId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async getFailedAttemptsCount(): Promise<number> {
    return this.failedAttempts;
  }

  async getPrizeAmount(): Promise<number> {
    return this.prizeAmount;
  }

  // For demo purposes, incrementing failed attempts when AI responds
  async incrementFailedAttempts(): Promise<number> {
    this.failedAttempts += 1;
    this.prizeAmount += 1; // Increase prize by $1 for each failed attempt
    return this.failedAttempts;
  }
  
  async getAllPayments(): Promise<Payment[]> {
    return Array.from(this.paymentsData.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Newest first
  }
  
  async withdrawPrize(sessionId: string, method: string): Promise<Payment> {
    const amount = this.prizeAmount;
    this.prizeAmount = 0; // Reset prize amount after withdrawal
    
    // Create a payment record for the withdrawal
    const id = this.paymentCurrentId++;
    const timestamp = new Date();
    const payment = { 
      id, 
      session_id: sessionId,
      user_id: null, 
      amount, 
      status: "pending",
      method: method || null, 
      timestamp
    } as Payment;
    
    this.paymentsData.set(id, payment);
    return payment;
  }
}

import { SupabaseStorage } from "./supabase-storage";

// Modificar esta linha para usar o SupabaseStorage em vez do MemStorage
export const storage = new SupabaseStorage();
