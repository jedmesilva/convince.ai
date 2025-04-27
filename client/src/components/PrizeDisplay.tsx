
import React from 'react';
import { DollarSign } from 'lucide-react';

interface PrizeDisplayProps {
  prizeAmount: number;
  failedAttempts: number;
}

const PrizeDisplay: React.FC<PrizeDisplayProps> = ({ prizeAmount, failedAttempts }) => {
  // Format prize amount with commas for thousands
  const formattedPrize = new Intl.NumberFormat('pt-BR').format(prizeAmount);
  
  return (
    <div className="w-full max-w-md mx-auto py-6 px-4">
      <div className="bg-gradient-to-r from-theme-dark-purple via-theme-purple to-theme-dark-purple rounded-xl shadow-lg p-6 border border-theme-purple">
        <div className="flex items-center justify-center mb-2">
          <DollarSign className="h-8 w-8 text-yellow-400 mr-2" />
          <h3 className="text-xl font-bold text-theme-soft-purple">Prêmio Acumulado</h3>
        </div>
        
        <div className="flex flex-col items-center justify-center">
          <div className="text-4xl md:text-5xl font-bold text-theme-light-purple relative">
            <span className="relative z-10">R$ {formattedPrize}</span>
            <div className="absolute inset-0 bg-gradient-shimmer bg-[length:200%_100%] animate-shimmer opacity-30"></div>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-theme-soft-purple">
              {failedAttempts} pessoas fracassaram com argumentos fracos.
              <br />
              <span className="font-bold">Quer tentar algo melhor que elas?</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrizeDisplay;
