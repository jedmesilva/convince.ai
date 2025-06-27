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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header Section */}
      <div className="container mx-auto px-4 py-6">
        {/* Top section with AI Avatar and Prize */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* AI Avatar - Central focus */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center">
            <div className="mb-6">
              <AiAvatar persuasionLevel={persuasionLevel} />
            </div>
            <p className="text-center text-theme-soft-purple text-lg max-w-md">
              Ganhe todo o prêmio acumulado se conseguir persuadir a IA!
            </p>
          </div>

          {/* Prize Display - Side panel on desktop, below on mobile */}
          <div className="lg:col-span-1 flex flex-col justify-center">
            <PrizeDisplay prizeAmount={prizeAmount} failedAttempts={failedAttempts} />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {/* Attempts List - Side panel */}
          <div className="xl:col-span-1 order-2 xl:order-1">
            <div className="sticky top-6">
              <AttemptsList />
            </div>
          </div>

          {/* Chat Interface - Main content */}
          <div className="xl:col-span-3 order-1 xl:order-2">
            <div className="max-w-4xl mx-auto">
              <ChatInterface 
                isUnlocked={isUnlocked} 
                onAiResponse={handleAiResponse}
                onPersuasionChange={handlePersuasionChange}
              />
            </div>
          </div>
        </div>
      </div>

      <Toaster />
    </div>
  );
};

export default Index;