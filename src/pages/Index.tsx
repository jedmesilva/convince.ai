import React, { useState, useEffect } from 'react';
import AiAvatar from '../components/AiAvatar';
import UserEmail from '../components/UserEmail';
import PrizeDisplay from '../components/PrizeDisplay';
import ChatInterface from '../components/ChatInterface';
import AttemptsList from '../components/AttemptsList';
import { Toaster } from "../components/ui/toaster";
import { supabase } from '@/lib/supabase';

const Index = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [persuasionLevel, setPersuasionLevel] = useState(0);

  const handlePaymentSuccess = async () => {
    setIsUnlocked(true);
    
    // Incrementar o prêmio no banco de dados
    try {
      // Obter o prêmio atual
      const { data: prizeData } = await supabase
        .from('prize_pools')
        .select('id, amount')
        .order('id', { ascending: false })
        .limit(1)
        .single();
      
      if (prizeData) {
        // Atualizar o valor do prêmio
        await supabase
          .from('prize_pools')
          .update({ amount: prizeData.amount + 1 })
          .eq('id', prizeData.id);
      }
    } catch (error) {
      console.error("Erro ao atualizar prêmio:", error);
    }
  };

  const handlePersuasionChange = (level: number) => {
    setPersuasionLevel(level);
  };

  const handleAiResponse = async (response: string) => {
    // Se o timer acabou, bloqueia o chat novamente
    if (response === 'timer_ended') {
      setIsUnlocked(false);
      setPersuasionLevel(0);
      
      // Registrar tentativa falha no banco de dados
      try {
        const sessionId = localStorage.getItem('sessionId') || crypto.randomUUID();
        await supabase
          .from('persuasion_attempts')
          .insert({
            session_id: sessionId,
            status: 'failed'
          });
      } catch (error) {
        console.error("Erro ao registrar tentativa falha:", error);
      }
      
      return;
    }

    // Se a resposta não indica vitória, registrar tentativa falha
    if (!response.toLowerCase().includes("parabéns") && !response.toLowerCase().includes("venceu")) {
      try {
        const sessionId = localStorage.getItem('sessionId') || crypto.randomUUID();
        await supabase
          .from('persuasion_attempts')
          .insert({
            session_id: sessionId,
            status: 'failed'
          });
      } catch (error) {
        console.error("Erro ao registrar tentativa falha:", error);
      }
    }

    // Se a resposta for sobre pagamento, processa o pagamento
    if (response.toLowerCase().includes("pagamento concluído")) {
      handlePaymentSuccess();
    }
  };

  return (
    <div className="min-h-screen container mx-auto py-8 px-4 pb-[550px]">
      <div className="flex justify-center items-center mb-4">
        <AiAvatar persuasionLevel={persuasionLevel} />
      </div>

      {/* PrizeDisplay aparece logo abaixo da IA */}
      <PrizeDisplay />

      <p className="text-center text-theme-soft-purple mt-4 mb-8">
        Ganhe todo o prêmio acumulado se conseguir persuadir a IA!
      </p>

      {/* Lista de pessoas que tentaram */}
      <AttemptsList />

      <div className="mt-10 max-w-2xl mx-auto relative">
        <ChatInterface 
          isUnlocked={isUnlocked} 
          onAiResponse={handleAiResponse}
          onPersuasionChange={handlePersuasionChange}
        />
      </div>

      <Toaster />
    </div>
  );
};

export default Index;