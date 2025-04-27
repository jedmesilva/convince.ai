
import React from 'react';
import { DollarSign, Trophy } from 'lucide-react';

interface PrizeDisplayProps {
  prizeAmount: number;
  failedAttempts: number;
}

const PrizeDisplay: React.FC<PrizeDisplayProps> = ({ prizeAmount, failedAttempts }) => {
  const formattedPrize = new Intl.NumberFormat('pt-BR').format(prizeAmount);
  const lastWinnerPrize = new Intl.NumberFormat('pt-BR').format(5000);
  
  return (
    <div className="w-full max-w-md mx-auto py-2 px-4">
      <div className="bg-gradient-to-r from-theme-dark-purple via-theme-purple to-theme-dark-purple rounded-xl shadow-lg p-4 border border-theme-purple">
        <div className="flex items-center justify-center mb-2">
          <DollarSign className="h-8 w-8 text-yellow-400 mr-2" />
          <h3 className="text-xl font-bold text-theme-soft-purple">Prêmio Acumulado</h3>
        </div>
        
        <div className="flex flex-col items-center justify-center">
          <div className="text-4xl md:text-5xl font-bold text-theme-light-purple relative">
            <span className="relative z-10">R$ {formattedPrize}</span>
            <div className="absolute inset-0 bg-gradient-shimmer bg-[length:200%_100%] animate-shimmer opacity-30"></div>
          </div>
          
          <div className="mt-2 text-center">
            <p className="text-sm text-theme-soft-purple">
              {failedAttempts} pessoas tentaram mas falharam!
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-theme-purple/30 w-full text-center">
            <div className="flex items-center justify-center mb-2">
              <Trophy className="h-4 w-4 text-yellow-400 mr-2" />
              <p className="text-sm text-theme-soft-purple">
                Prêmio anterior: <span className="text-theme-bright-purple">Maria</span> ganhou R$ {lastWinnerPrize} ao persuadir a IA com maestria!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrizeDisplay;
