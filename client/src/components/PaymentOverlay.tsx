import React from 'react';
import { Button } from '@/components/ui/button';
import { DollarSign } from 'lucide-react';

interface PaymentOverlayProps {
  onTryButtonClick: () => void;
  failedAttempts: number;
}

const PaymentOverlay: React.FC<PaymentOverlayProps> = ({ onTryButtonClick, failedAttempts }) => {
  return (
    <div className="payment-overlay absolute inset-0 flex flex-col items-center justify-center p-4 z-10">
      <div className="text-center mb-4">
        <p className="text-primary font-medium mb-2">{failedAttempts} pessoas fracassaram com argumentos chulos</p>
        <p className="text-white">Quer tentar algo melhor que elas?</p>
      </div>
      
      <Button 
        onClick={onTryButtonClick} 
        className="bg-primary hover:bg-secondary text-white font-medium transition-all duration-300 flex items-center"
      >
        <DollarSign className="h-4 w-4 mr-2" />
        <span>$1</span>
        <span className="ml-2">Convencer</span>
      </Button>
    </div>
  );
};

export default PaymentOverlay;
