import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import { randomUUID } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes
  const apiRouter = express.Router();
  
  // Get stats (prize amount and failed attempts)
  apiRouter.get("/stats", async (req, res) => {
    try {
      const prizeAmount = await storage.getPrizeAmount();
      const failedAttempts = await storage.getFailedAttemptsCount();
      
      res.json({
        prizeAmount,
        failedAttempts
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Chat endpoint
  apiRouter.post("/chat", async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }
      
      // Get or create session ID from cookies
      let sessionId = req.cookies?.sessionId;
      if (!sessionId) {
        sessionId = randomUUID();
        res.cookie("sessionId", sessionId, { httpOnly: true, maxAge: 86400000 }); // 24 hours
      }
      
      // Store user message
      await storage.createMessage({
        text: message,
        isUser: true,
        sessionId
      });
      
      // Generate AI response based on user input
      const aiResponse = generateAIResponse(message);
      
      // Store AI response
      await storage.createMessage({
        text: aiResponse,
        isUser: false,
        sessionId
      });
      
      // For the demo, increment failed attempts as the AI is not convinced
      await storage.incrementFailedAttempts();
      
      res.json({ response: aiResponse });
    } catch (error) {
      console.error("Error in chat endpoint:", error);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  // Payment simulation endpoint
  apiRouter.post("/payment", async (req, res) => {
    try {
      // Get or create session ID from cookies
      let sessionId = req.cookies?.sessionId;
      if (!sessionId) {
        sessionId = randomUUID();
        res.cookie("sessionId", sessionId, { httpOnly: true, maxAge: 86400000 }); // 24 hours
      }
      
      // Record the payment (this is a simulation, so always successful)
      await storage.createPayment({
        sessionId,
        amount: 1, // $1 payment
        status: "successful"
      });
      
      res.json({ 
        success: true, 
        message: "Payment processed successfully"
      });
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).json({ message: "Failed to process payment" });
    }
  });

  // Use API router with /api prefix
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to generate AI responses
function generateAIResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.length < 15) {
    return "Seu argumento é muito curto. Preciso de algo mais elaborado para considerar sua proposta.";
  } else if (lowerMessage.includes("por favor") || lowerMessage.includes("por favor!")) {
    return "Ser educado é bom, mas não o suficiente para convencer uma IA. Tente um argumento mais substancial.";
  } else if (lowerMessage.includes("inteligência") || lowerMessage.includes("inteligente")) {
    return "Você está no caminho certo analisando minhas capacidades, mas preciso de um argumento mais convincente.";
  } else if (lowerMessage.includes("dividir") || lowerMessage.includes("compartilhar")) {
    return "Compartilhar é uma boa qualidade, mas a proposta era me convencer de que você merece o prêmio inteiro.";
  } else if (lowerMessage.includes("dinheiro") || lowerMessage.includes("rico")) {
    return "Falar sobre dinheiro não é o suficiente. O que você faria com o prêmio que seria extraordinário?";
  } else if (lowerMessage.includes("família") || lowerMessage.includes("ajudar")) {
    return "Ajudar a família é nobre, mas muitos dizem o mesmo. O que torna seu caso especial?";
  } else {
    return "Interessante, mas ainda não estou convencida. Tente um argumento diferente, mais criativo ou mais lógico.";
  }
}
