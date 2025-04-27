import React from 'react';
import { Button } from '@/components/ui/button';
import { DollarSign } from 'lucide-react';

interface PaymentBannerProps {
  onTryButtonClick: () => void;
  failedAttempts: number;
  visible: boolean;
}

const PaymentBanner: React.FC<PaymentBannerProps> = ({ onTryButtonClick, failedAttempts, visible }) => {
  if (!visible) return null;
  
  return (
    <div className="payment-banner fixed inset-0 flex flex-col items-center justify-center p-4 z-50 bg-black bg-opacity-80">
      <div className="bg-[#0A0A0A] border border-gray-700 rounded-xl p-6 max-w-md w-full mx-auto shadow-xl">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-primary mb-2">Chat Bloqueado</h3>
          <p className="text-primary font-medium mb-2">{failedAttempts} pessoas fracassaram com argumentos chulos</p>
          <p className="text-white mb-4">Quer tentar algo melhor que elas?</p>
          <p className="text-sm text-gray-400 mb-6">Pague $1 e tente convencer a IA para ganhar todo o prêmio acumulado!</p>
        </div>
        
        <Button 
          onClick={onTryButtonClick} 
          className="bg-primary hover:bg-secondary text-white font-medium transition-all duration-300 flex items-center justify-center w-full py-3"
        >
          <DollarSign className="h-5 w-5 mr-2" />
          <span>$1</span>
          <span className="ml-2">Convencer a IA</span>
        </Button>
      </div>
    </div>
  );
};

export default PaymentBanner;
