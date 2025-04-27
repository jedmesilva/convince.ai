import React, { useState } from 'react';
import AiAvatar from '../components/AiAvatar';
import UserEmail from '../components/UserEmail';
import PrizeDisplay from '../components/PrizeDisplay';
import ChatInterface from '../components/ChatInterface';
import AttemptsList from '../components/AttemptsList';
import { Toaster } from "../components/ui/toaster";

const Index = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [prizeAmount, setPrizeAmount] = useState(5400); // $5400 initial prize
  const [failedAttempts, setFailedAttempts] = useState(540); // 540 initial failed attempts
  const [persuasionLevel, setPersuasionLevel] = useState(0);

  const handlePaymentSuccess = () => {
    setIsUnlocked(true);
    // Increase prize amount by 1 dollar
    setPrizeAmount(prevAmount => prevAmount + 1);
  };

  const handlePersuasionChange = (level: number) => {
    setPersuasionLevel(level);
  };

  const handleAiResponse = (response: string) => {
    // Se o timer acabou, bloqueia o chat novamente
    if (response === 'timer_ended') {
      setIsUnlocked(false);
      setFailedAttempts(prevAttempts => prevAttempts + 1);
      setPersuasionLevel(0);
      return;
    }

    // If the response doesn't indicate winning, increment failed attempts
    if (!response.toLowerCase().includes("parabéns") && !response.toLowerCase().includes("venceu")) {
      setFailedAttempts(prevAttempts => prevAttempts + 1);
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
      <PrizeDisplay prizeAmount={prizeAmount} failedAttempts={failedAttempts} />

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