// Simplified storage implementation in JavaScript

// Interface for storage
export class MemStorage {
  constructor() {
    this.users = new Map();
    this.messagesData = new Map();
    this.paymentsData = new Map();
    this.userCurrentId = 1;
    this.messageCurrentId = 1;
    this.paymentCurrentId = 1;
    this.failedAttempts = 0;
    this.prizeAmount = 10; // Initial prize amount
  }

  async getUser(id) {
    return this.users.get(id);
  }

  async getUserByUsername(username) {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser) {
    const id = this.userCurrentId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createMessage(insertMessage) {
    const id = this.messageCurrentId++;
    const timestamp = new Date();
    const message = { ...insertMessage, id, timestamp };
    this.messagesData.set(id, message);
    return message;
  }

  async getMessagesBySessionId(sessionId) {
    const messages = [];
    for (const message of this.messagesData.values()) {
      if (message.sessionId === sessionId) {
        messages.push(message);
      }
    }
    return messages;
  }

  async createPayment(insertPayment) {
    const id = this.paymentCurrentId++;
    const timestamp = new Date();
    const payment = { ...insertPayment, id, timestamp };
    this.paymentsData.set(id, payment);
    return payment;
  }

  async getPaymentsBySessionId(sessionId) {
    const payments = [];
    for (const payment of this.paymentsData.values()) {
      if (payment.sessionId === sessionId) {
        payments.push(payment);
      }
    }
    return payments;
  }

  async getFailedAttemptsCount() {
    return this.failedAttempts;
  }

  async getPrizeAmount() {
    return this.prizeAmount;
  }

  async incrementFailedAttempts() {
    this.failedAttempts += 1;
    this.prizeAmount += 1; // Increase prize by $1 for each failed attempt
    return this.failedAttempts;
  }
  
  async getAllPayments() {
    return Array.from(this.paymentsData.values());
  }
  
  async withdrawPrize(sessionId, method) {
    const amount = this.prizeAmount;
    this.prizeAmount = 0; // Reset prize amount after withdrawal
    
    // Create a payment record for the withdrawal
    const id = this.paymentCurrentId++;
    const timestamp = new Date();
    const payment = { 
      id, 
      sessionId, 
      amount, 
      status: "pending", 
      method,
      timestamp
    };
    this.paymentsData.set(id, payment);
    return payment;
  }
}

export const storage = new MemStorage();