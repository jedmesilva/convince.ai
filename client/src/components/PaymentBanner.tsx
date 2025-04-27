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
    <div className="payment-banner absolute inset-0 flex flex-col items-center justify-center p-4 z-30 bg-black bg-opacity-90">
      <div className="text-center mb-4">
        <p className="text-primary font-medium mb-2">{failedAttempts} pessoas fracassaram com argumentos chulos</p>
        <p className="text-white mb-2">Quer tentar algo melhor que elas?</p>
      </div>
      
      <Button 
        onClick={onTryButtonClick} 
        className="bg-primary hover:bg-secondary text-white font-medium transition-all duration-300 flex items-center justify-center py-3 px-6"
      >
        <DollarSign className="h-5 w-5 mr-2" />
        <span>$1</span>
        <span className="ml-2">Convencer a IA</span>
      </Button>
    </div>
  );
};

export default PaymentBanner;
