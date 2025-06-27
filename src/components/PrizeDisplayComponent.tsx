import React, { useState, useEffect } from 'react';
import { DollarSign, Trophy, Users, Clock, Zap, Brain } from 'lucide-react';

interface Attempt {
  id: number;
  name: string;
  time: string;
  status: 'fracassou' | 'sucesso';
  avatar?: string;
}

interface PrizeDisplayProps {
  prizeAmount: number;
  failedAttempts: number;
  winners?: number;
  className?: string;
  onShowChat?: () => void;
}

const PrizeDisplay: React.FC<PrizeDisplayProps> = ({ 
  prizeAmount, 
  failedAttempts, 
  winners = 1,
  className = '',
  onShowChat
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  
  const formattedPrize = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0
  }).format(prizeAmount);
  
  const lastWinnerPrize = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0
  }).format(5000);

  // Animação do prêmio quando muda
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 600);
    return () => clearTimeout(timer);
  }, [prizeAmount]);
  
  return (
    <header className={`relative overflow-hidden ${className}`}>
      {/* Background original mantido */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-800 via-violet-500 to-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.2),transparent_50%)]" />
      </div>
      
      <div className="relative w-full px-4 py-6">
        {/* Badge de ganhadores */}
        <div className="flex justify-center mb-4">
          <div className="bg-violet-500/20 border border-violet-500/30 rounded-full px-4 py-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
            <span className="text-violet-100 text-sm font-medium">
              {winners} {winners === 1 ? 'pessoa já ganhou' : 'pessoas já ganharam'}
            </span>
          </div>
        </div>
        
        {/* Título principal */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-violet-100 mb-2 flex items-center justify-center gap-3">
            <div className="bg-violet-500/20 p-2 rounded-lg">
              <DollarSign className="h-6 w-6 text-violet-300" />
            </div>
            Prêmio Acumulado
          </h1>
          
          {/* Valor do prêmio com cores originais */}
          <div className={`text-5xl md:text-7xl font-black text-violet-200 transition-all duration-500 ${
            isAnimating ? 'scale-110 drop-shadow-2xl' : 'scale-100'
          }`}>
            {formattedPrize}
          </div>
          
          {/* Indicador de crescimento */}
          <div className="mt-2 flex items-center justify-center gap-2 text-violet-300">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-medium">Crescendo a cada tentativa!</span>
          </div>
        </div>

        {/* Seção explicativa e call-to-action */}
        <div className="max-w-2xl mx-auto mb-6">
          <div className="bg-slate-700/30 backdrop-blur-sm rounded-2xl p-6 border border-violet-500/20 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Brain className="h-8 w-8 text-violet-300" />
              </div>
              <p className="text-violet-100/90 text-lg leading-relaxed">
                O <span className="font-bold text-violet-300">Vince</span> tem acumulado todo esse prêmio! Ele tem muitos objetivos audaciosos, mas se você se esforçar e conseguir convencê-lo, ele pode lhe dar todo o valor acumulado!
              </p>
            </div>
            
            <div className="space-y-3">
              <p className="text-violet-200 font-medium">Quer tentar a sua sorte?</p>
              <button 
                onClick={onShowChat}
                className="group relative bg-violet-400 hover:bg-violet-300 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl active:scale-95"
              >
                <span className="text-lg">Tentar Convencer o Vince</span>
                <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </div>
          </div>
        </div>

        {/* Último vencedor com cores originais */}
        <div className="bg-slate-700/30 backdrop-blur-sm rounded-xl p-4 border border-violet-500/30">
          <div className="flex items-center gap-4">
            <div className="bg-violet-500/30 rounded-xl p-3 flex-shrink-0">
              <Trophy className="h-6 w-6 text-violet-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-violet-100/80 font-medium">Último Vencedor</p>
              <p className="text-violet-100 text-lg">
                <span className="font-bold text-violet-400">Maria</span> conquistou {lastWinnerPrize} com persuasão excepcional!
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// Componente de tentativa individual melhorado
const AttemptCard: React.FC<{ attempt: Attempt; index: number }> = ({ attempt, index }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 100);
    return () => clearTimeout(timer);
  }, [index]);
  
  return (
    <div 
      className={`transform transition-all duration-500 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-slate-700 rounded-lg p-4 border-l-4 border-violet-500 hover:bg-slate-600 transition-all duration-300 flex items-center">
        {/* Número da tentativa */}
        <div className="bg-violet-500/20 rounded-lg px-3 py-2 mr-4 flex-shrink-0">
          <span className="text-violet-200 font-bold text-lg">{attempt.id}°</span>
        </div>
        
        {/* Informações da tentativa */}
        <div className="flex-1 min-w-0">
          <p className="text-slate-300">
            <span className="font-semibold text-white">{attempt.name}</span> tentou {attempt.time}, mas <span className="text-red-400">fracassou!</span>
          </p>
        </div>
      </div>
    </div>
  );
};

// Demo component melhorado
const Demo = () => {
  const [currentPrize, setCurrentPrize] = useState(5400);
  const [attempts, setAttempts] = useState(540);
  
  const recentAttempts: Attempt[] = [
    { id: 540, name: "Lucas", time: "agora mesmo", status: "fracassou" },
    { id: 539, name: "Maria", time: "há 1 min", status: "fracassou" },
    { id: 538, name: "João", time: "há 3 min", status: "fracassou" },
    { id: 537, name: "Ana", time: "há 5 min", status: "fracassou" },
    { id: 536, name: "Pedro", time: "há 8 min", status: "fracassou" },
    { id: 535, name: "Carlos", time: "há 10 min", status: "fracassou" },
    { id: 534, name: "Sofia", time: "há 12 min", status: "fracassou" },
    { id: 533, name: "Rafael", time: "há 15 min", status: "fracassou" },
    { id: 532, name: "Julia", time: "há 18 min", status: "fracassou" },
    { id: 531, name: "Diego", time: "há 20 min", status: "fracassou" },
    { id: 530, name: "Amanda", time: "há 22 min", status: "fracassou" },
    { id: 529, name: "Thiago", time: "há 25 min", status: "fracassou" }
  ];

  // Simula atualizações em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPrize(prev => prev + 10);
      setAttempts(prev => prev + 1);
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-900">
      <PrizeDisplay 
        prizeAmount={currentPrize} 
        failedAttempts={attempts}
        winners={1}
        className="shadow-2xl border-b border-violet-500"
        onShowChat={() => console.log('Show chat clicked')}
      />
      
      {/* Área de conteúdo */}
      <div className="w-full px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-violet-100 mb-6 flex items-center gap-3">
            <Clock className="h-6 w-6 text-violet-400" />
            Tentativas Recentes
          </h2>
          
          <div className="space-y-3 py-4">
            {recentAttempts.map((attempt, index) => (
              <AttemptCard key={attempt.id} attempt={attempt} index={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Demo;