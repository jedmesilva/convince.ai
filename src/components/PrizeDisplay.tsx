
import React, { useEffect, useState } from 'react';
import { DollarSign, Trophy, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PrizeDisplayProps {
  initialPrizeAmount?: number;
  initialFailedAttempts?: number;
}

const PrizeDisplay: React.FC<PrizeDisplayProps> = ({ 
  initialPrizeAmount,
  initialFailedAttempts
}) => {
  const [prizeAmount, setPrizeAmount] = useState<number>(0);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Buscar dados reais do banco de dados
  useEffect(() => {
    const fetchPrizeData = async () => {
      setIsLoading(true);
      
      try {
        // Tentar obter o prêmio atual - se a consulta falhar, mantemos o valor como 0
        try {
          const { data, error } = await supabase
            .from('prize_pools')
            .select('*')
            .order('id', { ascending: false })
            .limit(1);
          
          if (!error && data && data.length > 0) {
            // Usar apenas se o valor for válido
            const amount = parseFloat(data[0].amount || 0);
            if (!isNaN(amount) && amount > 0) {
              setPrizeAmount(amount);
            }
          }
        } catch (err) {
          console.error("Erro ao buscar prêmio:", err);
          // Mantém o valor padrão 0
        }
        
        // Contar tentativas falhas - se falhar, mantemos o contador em 0
        try {
          const { count, error } = await supabase
            .from('persuasion_attempts')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'failed');
          
          if (!error && count !== null) {
            setFailedAttempts(count);
          }
        } catch (err) {
          console.error("Erro ao contar tentativas falhas:", err);
          // Mantém o valor padrão 0
        }
        
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPrizeData();
    
    // Não utilizamos mais simulações de crescimento do prêmio
    
    return () => {
      // Nada para limpar
    };
  }, []);
  
  const formattedPrize = new Intl.NumberFormat('pt-BR').format(prizeAmount);
  
  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto py-2 px-4 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-theme-purple" />
      </div>
    );
  }
  
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
                Seja o primeiro a ganhar o prêmio!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrizeDisplay;
