
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
    <div className="w-full">
      <div className="bg-gradient-to-r from-theme-dark-purple via-theme-purple to-theme-dark-purple rounded-xl shadow-2xl p-6 border border-theme-purple relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-theme-vivid-purple to-transparent"></div>
        </div>
        
        <div className="relative z-10">
          <div className="text-center mb-4">
            <div className="flex items-center justify-center mb-3">
              <DollarSign className="h-10 w-10 text-yellow-400 mr-2 animate-pulse" />
              <h3 className="text-2xl font-bold text-theme-soft-purple">Prêmio Acumulado</h3>
            </div>
            
            <div className="text-5xl lg:text-6xl font-bold text-theme-light-purple relative mb-4">
              <span className="relative z-10">R$ {formattedPrize}</span>
              <div className="absolute inset-0 bg-gradient-shimmer bg-[length:200%_100%] animate-shimmer opacity-30"></div>
            </div>
            
            <div className="bg-theme-purple bg-opacity-20 rounded-lg p-3 mb-4">
              <p className="text-lg text-theme-soft-purple font-medium">
                <span className="text-2xl font-bold text-theme-bright-purple">{failedAttempts}</span> pessoas tentaram mas falharam!
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-theme-purple/30">
            <div className="flex items-start space-x-3">
              <Trophy className="h-5 w-5 text-yellow-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-theme-soft-purple leading-relaxed">
                  <span className="font-semibold">Último vencedor:</span> <span className="text-theme-bright-purple font-bold">Maria</span> ganhou <span className="text-theme-light-purple font-semibold">R$ {lastWinnerPrize}</span> ao persuadir a IA com maestria!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrizeDisplay;
