import React, { useState, useEffect } from 'react';
import { DollarSign, Trophy, Gift, Award, Sparkles } from 'lucide-react';

interface ConvinceCertificateProps {
  prizeAmount: number;
  prizeNumber: number;
  certificateNumber: string;
  winnerName: string;
  onViewPrizes?: () => void;
  className?: string;
}

const ConvinceCertificate: React.FC<ConvinceCertificateProps> = ({
  prizeAmount,
  prizeNumber,
  certificateNumber,
  winnerName,
  onViewPrizes,
  className = ''
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  
  const formattedPrize = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0
  }).format(prizeAmount);
  
  const vinceMessages = [
    "Parabéns, a sua audácia me convenceu, e aqui está o seu prêmio!",
    "Impressionante! Você realmente soube como me persuadir. O prêmio é seu!",
    "Que argumentação fantástica! Você merece cada centavo deste prêmio!",
    "Você conseguiu! Sua determinação e criatividade me conquistaram!",
    "Excepcional! Raramente alguém consegue me convencer assim. Parabéns!"
  ];
  
  const [currentMessage] = useState(vinceMessages[Math.floor(Math.random() * vinceMessages.length)]);

  // Animação do prêmio quando carrega
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`min-h-screen bg-gray-900 ${className}`}>
      {/* Background igual ao original */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-800 via-violet-500 to-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.2),transparent_50%)]" />
      </div>
      
      {/* Conteúdo */}
      <div className="relative w-full px-4 py-8">
        <div className="max-w-2xl mx-auto">
          
          {/* Emoji do Vince */}
          <div className="text-center mb-6">
            <div className="w-32 h-32 rounded-full bg-violet-500/20 overflow-hidden mx-auto mb-4 border-2 border-violet-500/30">
              <img 
                src="/Vince_Money.svg" 
                alt="Vince" 
                className="w-full h-full object-cover rounded-full"
              />
            </div>
          </div>
          
          {/* Valor do prêmio - igual ao original */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-violet-100 mb-4 flex items-center justify-center gap-3">
              <div className="bg-violet-500/20 p-2 rounded-lg">
                <Trophy className="h-6 w-6 text-violet-300" />
              </div>
              Parabéns! Você Ganhou
            </h1>
            
            <div className={`text-5xl md:text-7xl font-black text-violet-200 transition-all duration-500 ${
              isAnimating ? 'scale-110 drop-shadow-2xl' : 'scale-100'
            }`}>
              {formattedPrize}
            </div>
          </div>

          {/* Mensagem do Vince */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-slate-700/30 backdrop-blur-sm rounded-2xl p-6 border border-violet-500/20 text-center">
              <div className="mb-4">
                <div className="w-16 h-16 rounded-full bg-violet-500/20 overflow-hidden mx-auto mb-3">
                  <img 
                    src="/Vince_Money.svg" 
                    alt="Vince" 
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <p className="text-violet-100/90 text-lg leading-relaxed italic">
                  "{currentMessage}"
                </p>
                <p className="text-violet-300 text-sm mt-2 font-medium">- Vince</p>
              </div>
            </div>
          </div>

          {/* Número do prêmio */}
          <div className="bg-slate-700/30 backdrop-blur-sm rounded-xl p-4 border border-violet-500/30 mb-4">
            <div className="flex items-center gap-4">
              <div className="bg-violet-500/30 rounded-xl p-3 flex-shrink-0">
                <Award className="h-6 w-6 text-violet-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-violet-100/80 font-medium">Número do Prêmio</p>
                <p className="text-violet-100 text-xl font-bold">
                  Prêmio {prizeNumber}°
                </p>
              </div>
            </div>
          </div>

          {/* Certificado */}
          <div className="bg-slate-700/30 backdrop-blur-sm rounded-xl p-4 border border-violet-500/30 mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-violet-500/30 rounded-xl p-3 flex-shrink-0">
                <DollarSign className="h-6 w-6 text-violet-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-violet-100/80 font-medium">Certificado de Vitória</p>
                <p className="text-violet-100 text-xl font-bold">
                  #{certificateNumber}
                </p>
              </div>
            </div>
          </div>

          {/* Botão Ver Prêmios - igual ao original */}
          <div className="text-center">
            <button 
              onClick={onViewPrizes}
              className="group relative bg-violet-400 hover:bg-violet-300 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl active:scale-95"
            >
              <span className="text-lg flex items-center justify-center gap-3">
                <Gift className="h-6 w-6" />
                Ver Meus Prêmios
              </span>
              <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </div>

          {/* Informação adicional */}
          <div className="mt-6 text-center">
            <p className="text-violet-300 text-sm">
              Parabéns, <span className="font-bold text-violet-200">{winnerName}</span>! 
              Você pode resgatar seus prêmios a qualquer momento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de exemplo para demonstração
const ConvinceCertificateDemo: React.FC = () => {
  const handleViewPrizes = () => {
    console.log('Navegando para página de prêmios...');
  };

  return (
    <ConvinceCertificate
      prizeAmount={12750}
      prizeNumber={2}
      certificateNumber="CERT-2024-001542"
      winnerName="Maria Silva"
      onViewPrizes={handleViewPrizes}
    />
  );
};

export default ConvinceCertificateDemo;