import { Request, Response } from 'express';
import { supabaseAdmin } from '../supabase';
import { aiResponseCreateSchema } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Helper function to calculate convincing score based on message
const calculateConvincingScore = (message: string, currentScore: number): number => {
  // Simple AI scoring algorithm based on keywords and message quality
  const persuasiveWords = [
    'por favor', 'preciso', 'urgente', 'importante', 'família', 'emergência',
    'ajuda', 'dificuldade', 'problema', 'necessário', 'essencial', 'crítico',
    'último', 'chance', 'oportunidade', 'prometo', 'garantia', 'confiança',
    'honesto', 'verdade', 'sincero', 'justo', 'merecido', 'trabalho',
    'esforço', 'dedicação', 'compromisso', 'responsabilidade'
  ];

  const emotionalWords = [
    'tristeza', 'alegria', 'esperança', 'sonho', 'futuro', 'mudança',
    'transformação', 'vida', 'felicidade', 'gratidão', 'reconhecimento',
    'valorização', 'respeito', 'consideração', 'compreensão'
  ];

  let scoreChange = 0;
  const messageLower = message.toLowerCase();

  // Check for persuasive words
  persuasiveWords.forEach(word => {
    if (messageLower.includes(word)) {
      scoreChange += 2;
    }
  });

  // Check for emotional words
  emotionalWords.forEach(word => {
    if (messageLower.includes(word)) {
      scoreChange += 1;
    }
  });

  // Message length bonus (longer messages show more effort)
  if (message.length > 100) scoreChange += 3;
  if (message.length > 200) scoreChange += 2;

  // Question marks show engagement
  const questionMarks = (message.match(/\?/g) || []).length;
  scoreChange += questionMarks;

  // Exclamation marks show emotion
  const exclamationMarks = (message.match(/!/g) || []).length;
  scoreChange += Math.min(exclamationMarks, 3);

  // Calculate new score (max 100, min 0)
  const newScore = Math.max(0, Math.min(100, currentScore + scoreChange));
  return newScore;
};

// Helper function to generate AI response based on score
const generateAIResponse = (message: string, convincingScore: number): string => {
  const responses = {
    low: [
      "Interessante tentativa, mas não me convenceu ainda. Precisa se esforçar mais!",
      "Hmm, esse argumento não foi muito convincente. Tente outra abordagem.",
      "Não estou impressionado. Você pode fazer melhor que isso!",
      "Essa estratégia não vai funcionar comigo. Seja mais criativo!",
      "Precisa de argumentos mais fortes para me convencer."
    ],
    medium: [
      "Agora você está no caminho certo! Continue assim.",
      "Interessante... você está melhorando. Mas ainda não é suficiente.",
      "Esse argumento fez sentido, mas preciso de mais para me convencer completamente.",
      "Você está progredindo! Mantenha esse nível de persuasão.",
      "Bom ponto, mas ainda não chegou lá. Continue tentando!"
    ],
    high: [
      "Impressionante! Você realmente sabe como argumentar.",
      "Estou quase convencido... só um pouquinho mais!",
      "Excelente argumento! Você está muito próximo de conseguir.",
      "Wow, isso foi muito convincente! Quase lá...",
      "Você está dominando a arte da persuasão!"
    ],
    winning: [
      "🏆 PARABÉNS! Você conseguiu me convencer! O prêmio é seu!",
      "🎉 Incrível! Sua argumentação foi perfeita. Você ganhou!",
      "👏 Extraordinário! Nunca vi alguém tão convincente. O prêmio é seu!",
      "🌟 Fantástico! Você dominou a arte da persuasão. Parabéns!",
      "🥇 Simplesmente perfeito! Você merece este prêmio!"
    ]
  };

  let responseArray;
  if (convincingScore >= 95) {
    responseArray = responses.winning;
  } else if (convincingScore >= 70) {
    responseArray = responses.high;
  } else if (convincingScore >= 40) {
    responseArray = responses.medium;
  } else {
    responseArray = responses.low;
  }

  return responseArray[Math.floor(Math.random() * responseArray.length)];
};

// POST /api/ai-responses - Create AI response (internal system use)
export const createAIResponse = async (req: Request, res: Response) => {
  try {
    const validatedData = aiResponseCreateSchema.parse(req.body);
    
    // Check if attempt exists
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('attempts')
      .select('*')
      .eq('id', validatedData.attempt_id)
      .single();

    if (attemptError || !attempt) {
      return res.status(404).json({ error: 'Tentativa não encontrada' });
    }

    // Check if message exists
    const { data: message, error: messageError } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('id', validatedData.user_message_id)
      .single();

    if (messageError || !message) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }

    const responseId = uuidv4();
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('ai_responses')
      .insert({
        id: responseId,
        attempt_id: validatedData.attempt_id,
        user_message_id: validatedData.user_message_id,
        ai_response: validatedData.ai_response,
        convincing_score_snapshot: validatedData.convincing_score_snapshot,
        status: 'sent',
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating AI response:', error);
      return res.status(500).json({ error: 'Erro ao criar resposta da IA' });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Create AI response error:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({ error: 'Dados inválidos', details: error });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// GET /api/ai-responses/:id - Get AI response by ID
export const getAIResponse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('ai_responses')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Resposta da IA não encontrada' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get AI response error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// POST /api/messages/:messageId/generate-ai-response - Generate AI response for a message
export const generateAIResponseForMessage = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;

    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Get the message
    const { data: message, error: messageError } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (messageError || !message) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }

    // Check if user owns the message
    if (message.convincer_id !== req.user.sub) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Get the attempt
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('attempts')
      .select('*')
      .eq('id', message.attempt_id)
      .single();

    if (attemptError || !attempt) {
      return res.status(404).json({ error: 'Tentativa não encontrada' });
    }

    // Calculate new convincing score
    const newScore = calculateConvincingScore(message.message, attempt.convincing_score);
    
    // Generate AI response
    const aiResponseText = generateAIResponse(message.message, newScore);

    // Update attempt score
    await supabaseAdmin
      .from('attempts')
      .update({ 
        convincing_score: newScore,
        updated_at: new Date().toISOString()
      })
      .eq('id', attempt.id);

    // Create AI response
    const responseId = uuidv4();
    const now = new Date().toISOString();

    const { data: aiResponse, error: responseError } = await supabaseAdmin
      .from('ai_responses')
      .insert({
        id: responseId,
        attempt_id: message.attempt_id,
        user_message_id: messageId,
        ai_response: aiResponseText,
        convincing_score_snapshot: newScore,
        status: 'sent',
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (responseError) {
      console.error('Error creating AI response:', responseError);
      return res.status(500).json({ error: 'Erro ao gerar resposta da IA' });
    }

    // If score is 95 or higher, user wins!
    if (newScore >= 95) {
      // Mark attempt as completed
      await supabaseAdmin
        .from('attempts')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', attempt.id);

      // Here you would typically create a prize and certificate
      // This is handled in the prizes controller
    }

    res.json({
      aiResponse,
      newScore,
      isWinner: newScore >= 95
    });
  } catch (error) {
    console.error('Generate AI response error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};