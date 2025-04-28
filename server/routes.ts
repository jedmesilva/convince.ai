import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { randomUUID } from "crypto";
import { WebSocketServer, WebSocket } from 'ws';
import { setupAuth } from "./auth";
import cookieParser from "cookie-parser";

// Map to store WebSocket connections by session ID
const connections = new Map<string, WebSocket>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar cookie parser
  app.use(cookieParser());

  // Configurar autenticação
  setupAuth(app);
  
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
        is_user: true,
        session_id: sessionId
      });
      
      // Generate AI response based on user input
      const aiResponse = generateAIResponse(message);
      
      // Store AI response
      await storage.createMessage({
        text: aiResponse,
        is_user: false,
        session_id: sessionId
      });
      
      // For the demo, increment failed attempts as the AI is not convinced
      await storage.incrementFailedAttempts();
      
      // Calculate persuasion level based on user message (simple algorithm)
      let persuasionChange = 0;
      const lowerCaseMessage = message.toLowerCase();
      const messageLength = lowerCaseMessage.length;
      
      // Longer messages are more persuasive (up to +5 points)
      if (messageLength > 100) persuasionChange += 5;
      else if (messageLength > 70) persuasionChange += 4;
      else if (messageLength > 50) persuasionChange += 3;
      else if (messageLength > 30) persuasionChange += 2;
      else if (messageLength > 15) persuasionChange += 1;
      
      // Certain persuasive keywords add points
      if (lowerCaseMessage.includes('porque') || lowerCaseMessage.includes('pois')) persuasionChange += 2;
      if (lowerCaseMessage.includes('importante') || lowerCaseMessage.includes('necessário')) persuasionChange += 2;
      if (lowerCaseMessage.includes('benefício') || lowerCaseMessage.includes('vantagem')) persuasionChange += 3;
      if (lowerCaseMessage.includes('futuro') || lowerCaseMessage.includes('potencial')) persuasionChange += 2;
      if (lowerCaseMessage.includes('inovação') || lowerCaseMessage.includes('criativo')) persuasionChange += 4;
      
      // Send persuasion update through WebSocket if client is connected
      const connection = connections.get(sessionId);
      if (connection && connection.readyState === WebSocket.OPEN) {
        // Get stored level or start with random initial value
        const storedData = JSON.parse(connection['userData'] || '{"level": 0}');
        let currentLevel = storedData.level || 0;
        
        // Update level
        currentLevel += persuasionChange;
        // Cap at 100
        currentLevel = Math.min(100, currentLevel);
        
        // Store updated level with the connection
        connection['userData'] = JSON.stringify({ level: currentLevel });
        
        // Send update to client
        connection.send(JSON.stringify({
          type: 'persuasionUpdate',
          level: currentLevel
        }));
        
        console.log(`Updated persuasion level for ${sessionId}: ${currentLevel}`);
      }
      
      res.json({ response: aiResponse });
    } catch (error) {
      console.error("Error in chat endpoint:", error);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  // Payment simulation endpoint (versão antiga, mantida para compatibilidade)
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
        session_id: sessionId,
        amount: 1, // $1 payment
        status: "successful",
        user_id: null,
        method: "card"
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
  
  // Nova API para processamento de pagamentos com dados do usuário
  apiRouter.post("/payments", async (req, res) => {
    try {
      const { session_id, amount, method, status, user_id } = req.body;
      
      if (!session_id || !amount) {
        return res.status(400).json({ message: "session_id e amount são obrigatórios" });
      }
      
      // Criar o registro de pagamento
      const payment = await storage.createPayment({
        session_id,
        amount,
        status: status || "completed",
        method: method || "credit_card",
        user_id: user_id || null
      });
      
      console.log("Pagamento processado:", payment);
      
      res.status(201).json(payment);
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      res.status(500).json({ message: "Falha ao processar pagamento" });
    }
  });

  // API to withdraw prize
  apiRouter.post("/withdraw", async (req, res) => {
    try {
      const { method } = req.body;
      
      if (!method) {
        return res.status(400).json({ message: "Method is required" });
      }
      
      // Get or create session ID from cookies
      let sessionId = req.cookies?.sessionId;
      if (!sessionId) {
        sessionId = randomUUID();
        res.cookie("sessionId", sessionId, { httpOnly: true, maxAge: 86400000 }); // 24 hours
      }
      
      // Process the withdrawal
      const withdrawal = await storage.withdrawPrize(sessionId, method);
      
      res.json({ 
        success: true, 
        message: "Withdrawal processed successfully",
        withdrawal
      });
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      res.status(500).json({ message: "Failed to process withdrawal" });
    }
  });
  
  // API to get payment history
  apiRouter.get("/payments", async (req, res) => {
    try {
      // Get session ID from cookies
      const sessionId = req.cookies?.sessionId;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }
      
      // Get payments for this session
      const payments = await storage.getPaymentsBySessionId(sessionId);
      
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payment history:", error);
      res.status(500).json({ message: "Failed to fetch payment history" });
    }
  });

  // Use API router with /api prefix
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  
  // Set up WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    // Handle client messages (receive session ID)
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Store the connection with the session ID
        if (data.type === 'register' && data.sessionId) {
          connections.set(data.sessionId, ws);
          console.log(`Client registered with session ID: ${data.sessionId}`);
          
          // Send initial persuasion level (random between 0-20 for new connections)
          const initialLevel = Math.floor(Math.random() * 20);
          ws.send(JSON.stringify({ 
            type: 'persuasionUpdate', 
            level: initialLevel 
          }));
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      
      // Remove connection from map
      for (const [sessionId, connection] of connections.entries()) {
        if (connection === ws) {
          connections.delete(sessionId);
          console.log(`Removed connection for session ID: ${sessionId}`);
          break;
        }
      }
    });
  });
  
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
