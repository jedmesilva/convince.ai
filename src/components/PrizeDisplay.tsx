
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
  const [prizeAmount, setPrizeAmount] = useState<number>(10000);
  const [failedAttempts, setFailedAttempts] = useState<number>(540);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Função para criar um registro inicial no prize_pool se não existir
  const createInitialPrize = async () => {
    try {
      const { data, error } = await supabase
        .from('prize_pools')
        .insert([{ amount: 10000 }])
        .select()
        .single();
      
      if (error) {
        console.error("Erro ao criar prêmio inicial:", error);
        // Continua usando o valor padrão em caso de erro
      } else if (data) {
        setPrizeAmount(data.amount);
      }
    } catch (err) {
      console.error("Erro ao criar prêmio inicial:", err);
    }
  };
  
  // Buscar dados reais do banco de dados
  useEffect(() => {
    const fetchPrizeData = async () => {
      setIsLoading(true);
      
      try {
        // Tentar obter o prêmio atual
        const { data: prizeData, error: prizeError } = await supabase
          .from('prize_pools')
          .select('amount')
          .order('id', { ascending: false })
          .limit(1)
          .single();
        
        if (prizeError) {
          console.error("Erro ao buscar prêmio:", prizeError);
          
          // Se for um erro de "nenhum registro encontrado", tenta criar um registro inicial
          if (prizeError.message.includes("no rows") || prizeError.details?.includes("0 rows")) {
            console.log("Nenhum registro de prêmio encontrado, criando um novo...");
            await createInitialPrize();
          }
        } else if (prizeData) {
          setPrizeAmount(prizeData.amount);
        }
        
        // Contar tentativas falhas
        const { count, error: countError } = await supabase
          .from('persuasion_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'failed');
        
        if (countError) {
          console.error("Erro ao contar tentativas falhas:", countError);
        } else if (count !== null) {
          setFailedAttempts(count);
        }
        
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPrizeData();
    
    // Atualizar a UI com pequenos incrementos para dar sensação de dinamismo
    const prizeIncreaseInterval = setInterval(() => {
      setPrizeAmount(current => current + Math.floor(Math.random() * 40) + 10);
    }, 6000);
    
    return () => {
      clearInterval(prizeIncreaseInterval);
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
