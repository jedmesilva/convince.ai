
import React, { useState } from 'react';
import AiAvatar from '@/components/AiAvatar';
import PrizeDisplay from '@/components/PrizeDisplay';
import ChatInterface from '@/components/ChatInterface';
import { Toaster } from "@/components/ui/toaster";

const Index = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [prizeAmount, setPrizeAmount] = useState(5400); // $5400 initial prize
  const [failedAttempts, setFailedAttempts] = useState(540); // 540 initial failed attempts
  
  const handlePaymentSuccess = () => {
    setIsUnlocked(true);
    // Increase prize amount by 1 dollar
    setPrizeAmount(prevAmount => prevAmount + 1);
  };
  
  const handleAiResponse = (response: string) => {
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
    <div className="min-h-screen container mx-auto py-8 px-4 pb-[500px]">
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-center text-gradient mb-2">
          Convença a IA
        </h1>
        <p className="text-center text-theme-soft-purple">
          Ganhe todo o prêmio acumulado se conseguir persuadir nossa IA!
        </p>
      </header>
      
      <div className="flex flex-col items-center mb-8">
        <AiAvatar />
      </div>
      
      <PrizeDisplay prizeAmount={prizeAmount} failedAttempts={failedAttempts} />
      
      <div className="mt-8 max-w-2xl mx-auto relative">
        <ChatInterface 
          isUnlocked={isUnlocked} 
          onAiResponse={handleAiResponse} 
        />
      </div>
      
      <footer className="mt-16 text-center text-sm text-gray-500">
        <p>© 2025 Convince AI - Uma chance de $1 para ganhar tudo!</p>
        <p className="mt-2">
          Esta é apenas uma demonstração - Nenhuma transação real é processada
        </p>
      </footer>
      
      <Toaster />
    </div>
  );
};

export default Index;
