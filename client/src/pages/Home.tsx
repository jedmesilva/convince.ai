import React, { useState } from 'react';
import AIRepresentation from '@/components/AIRepresentation';
import PrizeDisplay from '@/components/PrizeDisplay';
import ChatInterface from '@/components/ChatInterface';
import PaymentBanner from '@/components/PaymentBanner';
import PaymentModal from '@/components/PaymentModal';
import { useAIChat } from '@/contexts/AIChatContext';

const Home: React.FC = () => {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isChatLocked, setIsChatLocked] = useState(true);
  const { resetChat } = useAIChat();

  const handleTryButtonClick = () => {
    setIsPaymentModalOpen(true);
  };

  const handlePaymentConfirm = () => {
    setIsChatLocked(false);
    resetChat();
  };

  return (
    <div className="flex flex-col mx-auto max-w-md min-h-screen relative overflow-hidden px-4 pt-6 pb-4">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="font-bold text-3xl text-primary mb-1">Convença a IA</h1>
        <p className="text-sm text-gray-300">Ganhe todo o prêmio acumulado se conseguir persuadir nossa IA!</p>
      </header>
      
      {/* AI Representation */}
      <AIRepresentation />
      
      {/* Prize Display */}
      <PrizeDisplay prizeAmount={5401} failedAttempts={540} />
      
      {/* Chat Interface */}
      <ChatInterface isLocked={isChatLocked} />
      
      {/* Payment Banner (overlay) */}
      <PaymentBanner
        visible={isChatLocked}
        onTryButtonClick={handleTryButtonClick}
        failedAttempts={540}
      />
      
      {/* Payment Modal */}
      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentConfirm={handlePaymentConfirm}
      />
      
      {/* Footer */}
      <footer className="mt-4 text-center">
        <p className="text-xs text-gray-500">© 2025 Convince AI - Uma chance de $1 para ganhar tudo!</p>
        <p className="text-xs text-gray-500 mt-1">Esta é apenas uma demonstração - Nenhuma transação real é processada</p>
      </footer>
    </div>
  );
};

export default Home;
