import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { randomUUID } from "crypto";
import { WebSocketServer, WebSocket } from 'ws';
import cookieParser from "cookie-parser";
import { supabaseAdmin as supabase } from "./supabase";

// Map to store WebSocket connections by session ID
const connections = new Map<string, WebSocket>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar cookie parser
  app.use(cookieParser());
  
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
      
      // Buscar a tentativa de persuasão ativa para esta sessão
      let attemptId = null;
      try {
        const { data: activeAttempt } = await supabase
          .from('persuasion_attempts')
          .select('id')
          .eq('session_id', sessionId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (activeAttempt) {
          attemptId = activeAttempt.id;
          console.log(`Encontrada tentativa ativa ${attemptId} para sessão ${sessionId}`);
        } else {
          console.log(`Nenhuma tentativa ativa encontrada para sessão ${sessionId}`);
        }
      } catch (attemptError) {
        console.error("Erro ao buscar tentativa ativa:", attemptError);
      }
      
      // Store user message
      await storage.createMessage({
        text: message,
        is_user: true,
        session_id: sessionId,
        attempt_id: attemptId
      });
      
      // Generate AI response based on user input
      const aiResponse = generateAIResponse(message);
      
      // Store AI response
      await storage.createMessage({
        text: aiResponse,
        is_user: false,
        session_id: sessionId,
        attempt_id: attemptId
      });
      
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
      
      // Atualizar o nível de convencimento no banco de dados
      if (attemptId) {
        try {
          // Obter o nível atual de convencimento
          const { data: currentLevelData } = await supabase
            .from('convincing_levels')
            .select('level')
            .eq('attempt_id', attemptId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();
          
          let currentLevel = 0;
          if (currentLevelData) {
            currentLevel = currentLevelData.level;
          }
          
          // Atualizar o nível
          currentLevel += persuasionChange;
          currentLevel = Math.min(100, currentLevel); // Cap em 100
          
          // Registrar o novo nível
          await supabase
            .from('convincing_levels')
            .insert({
              attempt_id: attemptId,
              level: currentLevel
            });
          
          console.log(`Nível de convencimento atualizado para tentativa ${attemptId}: ${currentLevel}`);
          
          // Verificar se o usuário venceu (nível >= 90)
          if (currentLevel >= 90) {
            // Atualizar o status da tentativa para 'success'
            await supabase
              .from('persuasion_attempts')
              .update({ status: 'success' })
              .eq('id', attemptId);
            
            console.log(`Usuário venceu! Tentativa ${attemptId} marcada como sucesso`);
          }
          
          // Enviar atualização para o cliente via WebSocket
          const connection = connections.get(sessionId);
          if (connection && connection.readyState === WebSocket.OPEN) {
            connection.send(JSON.stringify({
              type: 'persuasionUpdate',
              level: currentLevel
            }));
          }
        } catch (levelError) {
          console.error("Erro ao atualizar nível de convencimento:", levelError);
        }
      } else {
        // Caso não exista tentativa, apenas atualizar o WebSocket (como antes)
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
          
          console.log(`Atualizado nível de persuasão para ${sessionId}: ${currentLevel} (sem tentativa registrada)`);
        }
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
      
      if (!session_id) {
        return res.status(400).json({ message: "session_id é obrigatório" });
      }
      
      // Valores default para fluxo de teste
      const finalAmount = amount || 1;
      
      console.log("Processando pagamento com:", {
        session_id, 
        amount: finalAmount, 
        method: method || "credit_card", 
        status: status || "completed"
      });
      
      // 1. Usar diretamente o Supabase para criar todas as entidades
      console.log("Inserindo diretamente com Supabase...");
      let payment;
      
      // 1a. Verificar se já existe um prêmio ativo ou criar um novo
      try {
        // Buscar prêmio ativo
        const { data: existingPrize, error: prizeError } = await supabase
          .from('prize_pools')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();
        
        if (prizeError) {
          console.log("Não há prêmio ativo, criando um novo...");
          // Criar novo prêmio com o valor da tentativa atual
          const { data: newPrize, error: newPrizeError } = await supabase
            .from('prize_pools')
            .insert({
              amount: finalAmount,
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
            
          if (newPrizeError) {
            console.error("Erro ao criar prêmio:", newPrizeError);
          } else {
            console.log("Novo prêmio criado:", newPrize);
          }
        } else {
          console.log("Prêmio ativo encontrado:", existingPrize);
          // Adicionar valor da tentativa atual ao prêmio existente
          const { data: updatedPrize, error: updateError } = await supabase
            .from('prize_pools')
            .update({ 
              amount: existingPrize.amount + finalAmount,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingPrize.id)
            .select()
            .single();
            
          if (updateError) {
            console.error("Erro ao atualizar prêmio:", updateError);
          } else {
            console.log("Prêmio atualizado:", updatedPrize);
          }
        }
      } catch (prizeError) {
        console.error("Erro ao processar prêmio:", prizeError);
      }
      
      // 2. Criar o registro de pagamento
      try {
        // Usar storage tradicional que já está funcionando
        payment = await storage.createPayment({
          session_id,
          amount: finalAmount,
          status: status || "completed",
          method: method || "credit_card",
          user_id: user_id || null
        });
        console.log("Pagamento processado via storage:", payment);
        
        // Alternativamente, inserir diretamente no Supabase
        const { data: paymentData, error: paymentError } = await supabase
          .from('payments')
          .insert({
            session_id,
            amount: finalAmount,
            status: status || "completed",
            method: method || "credit_card",
            user_id: user_id || null,
            timestamp: new Date().toISOString()
          })
          .select()
          .single();
          
        if (paymentError) {
          console.error("Erro ao inserir pagamento no Supabase:", paymentError);
        } else {
          console.log("Pagamento inserido no Supabase:", paymentData);
          payment = paymentData;
        }
      } catch (paymentError) {
        console.error("Erro ao processar pagamento:", paymentError);
      }
      
      // 3. Criar um registro de tentativa de persuasão
      try {
        const { data: attempt, error: attemptError } = await supabase
          .from('persuasion_attempts')
          .insert({
            session_id,
            user_id,
            status: 'active' // Começa como 'active', e poderá mudar para 'success' ou 'failed'
          })
          .select()
          .single();
          
        if (attemptError) {
          console.error("Erro ao criar registro de tentativa:", attemptError);
        } else {
          console.log("Tentativa de persuasão iniciada:", attempt);
          
          // 4. Criar um registro de timer para esta tentativa
          const { data: persuasionTimer, error: timerError } = await supabase
            .from('persuasion_timers')
            .insert({
              attempt_id: attempt.id,
              duration_seconds: 120, // 2 minutos
              started_at: new Date().toISOString()
            })
            .select()
            .single();
            
          if (timerError) {
            console.error("Erro ao criar timer de persuasão:", timerError);
          } else {
            console.log("Timer de persuasão iniciado:", persuasionTimer);
          }
          
          // 5. Inicializar o nível de convencimento com zero
          const { data: convincingLevel, error: levelError } = await supabase
            .from('convincing_levels')
            .insert({
              attempt_id: attempt.id,
              level: 0, // Inicia em zero
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
            
          if (levelError) {
            console.error("Erro ao inicializar nível de convencimento:", levelError);
          } else {
            console.log("Nível de convencimento inicializado:", convincingLevel);
          }
        }
      } catch (attemptError) {
        console.error("Erro ao processar tentativa de persuasão:", attemptError);
      }
      
      res.status(201).json({
        ...payment,
        persuasion_attempt_created: true
      });
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
  
  // API para obter a tentativa de persuasão ativa para uma sessão
  apiRouter.get("/active-attempt", async (req, res) => {
    try {
      const { session_id } = req.query;
      
      if (!session_id) {
        return res.status(400).json({ message: "session_id é obrigatório" });
      }
      
      console.log(`Buscando tentativa ativa para a sessão ${session_id}`);
      
      // Buscar a tentativa ativa mais recente
      const { data, error } = await supabase
        .from('persuasion_attempts')
        .select('id')
        .eq('session_id', session_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        // Se for o erro 'No rows found', não é um erro real
        if (error.code === 'PGRST116') {
          return res.status(200).json({ 
            message: "Nenhuma tentativa ativa encontrada",
            attempt_id: null 
          });
        }
        
        console.error("Erro ao buscar tentativa ativa:", error);
        return res.status(500).json({ message: "Erro ao buscar tentativa ativa" });
      }
      
      res.status(200).json({
        attempt_id: data.id
      });
    } catch (error) {
      console.error("Erro ao buscar tentativa ativa:", error);
      res.status(500).json({ message: "Erro ao buscar tentativa ativa" });
    }
  });
  
  // API para finalizar uma tentativa de persuasão quando o timer expirar
  apiRouter.post("/finalize-attempt", async (req, res) => {
    try {
      const { session_id, attempt_id } = req.body;
      
      if (!session_id || !attempt_id) {
        return res.status(400).json({ message: "session_id e attempt_id são obrigatórios" });
      }
      
      console.log(`Finalizando tentativa ${attempt_id} para a sessão ${session_id}`);
      
      // Buscar o nível de convencimento atual
      const { data: levelData, error: levelError } = await supabase
        .from('convincing_levels')
        .select('level')
        .eq('attempt_id', attempt_id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (levelError) {
        console.error("Erro ao buscar nível de convencimento:", levelError);
        return res.status(500).json({ message: "Erro ao buscar nível de convencimento" });
      }
      
      const currentLevel = levelData?.level || 0;
      const isSuccess = currentLevel >= 90; // Sucesso se o nível for >= 90
      
      // Atualizar o status da tentativa
      const { data, error } = await supabase
        .from('persuasion_attempts')
        .update({ 
          status: isSuccess ? 'success' : 'failed'
        })
        .eq('id', attempt_id)
        .select()
        .single();
      
      if (error) {
        console.error("Erro ao finalizar tentativa:", error);
        return res.status(500).json({ message: "Erro ao finalizar tentativa" });
      }
      
      // Se a tentativa falhou, incrementar o contador de tentativas falhas
      if (!isSuccess) {
        await storage.incrementFailedAttempts();
      }
      
      res.status(200).json({
        success: true,
        attempt: data,
        status: isSuccess ? 'success' : 'failed',
        level: currentLevel
      });
    } catch (error) {
      console.error("Erro ao finalizar tentativa:", error);
      res.status(500).json({ message: "Erro ao finalizar tentativa" });
    }
  });

  // Adicionar as rotas de autenticação que utilizam o Supabase Auth
  
  // Rota para obter usuário atual
  // Como estamos usando apenas Supabase Auth, o frontend será responsável 
  // por verificar a autenticação diretamente com o Supabase
  apiRouter.get("/user", (req, res) => {
    return res.status(401).json({ message: "Use Supabase Auth diretamente no frontend" });
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
