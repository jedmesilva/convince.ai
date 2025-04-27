import React from 'react';
import { DollarSign } from 'lucide-react';

interface PrizeDisplayProps {
  prizeAmount: number;
  failedAttempts: number;
}

const PrizeDisplay: React.FC<PrizeDisplayProps> = ({ prizeAmount, failedAttempts }) => {
  const formattedPrize = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(prizeAmount);

  return (
    <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-5 mb-6 relative overflow-hidden">
      <div className="flex items-center mb-2">
        <span className="text-yellow-400 mr-2">
          <DollarSign className="h-5 w-5" />
        </span>
        <h2 className="font-semibold text-xl text-yellow-400">Prêmio Acumulado</h2>
      </div>
      <div className="text-3xl font-bold text-white mb-3">
        R$ {formattedPrize}
      </div>
      <p className="text-gray-300 text-sm">
        {failedAttempts} pessoas fracassaram com argumentos fracos.
      </p>
      <p className="text-gray-300 text-sm">
        Quer tentar algo melhor que elas?
      </p>
    </div>
  );
};

export default PrizeDisplay;
