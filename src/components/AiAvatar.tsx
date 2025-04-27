import React, { useEffect, useState } from 'react';
import UserEmail from './UserEmail';

interface AiAvatarProps {
  persuasionLevel: number;
}

const AiAvatar: React.FC<AiAvatarProps> = ({ persuasionLevel }) => {
  const [dashOffset, setDashOffset] = useState(283); // Circunferência inicial (2 * PI * r, onde r = 45)
  
  // Cores baseadas no nível de persuasão
  const getPersuasionColor = () => {
    if (persuasionLevel < 30) return "#ef4444"; // red-500
    if (persuasionLevel < 70) return "#eab308"; // yellow-500
    return "#22c55e"; // green-500
  };
  
  // Atualiza o offset do traço baseado no nível de persuasão
  useEffect(() => {
    // Circunferência completa é aproximadamente 283 (2 * PI * 45)
    // Converte a porcentagem para um valor de offset do traço (diminui conforme a persuasão aumenta)
    const calculatedOffset = 283 - (283 * persuasionLevel / 100);
    setDashOffset(calculatedOffset);
  }, [persuasionLevel]);
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40 md:w-56 md:h-56 mb-4">
        {/* Glow effect behind avatar */}
        <div className="absolute inset-0 bg-theme-vivid-purple rounded-full opacity-20 blur-xl animate-pulse"></div>
        
        {/* AI Avatar image */}
        <div className="relative z-10 w-full h-full rounded-full border-4 border-theme-purple bg-theme-dark-purple flex items-center justify-center overflow-hidden">
          <div className="text-6xl md:text-7xl text-theme-light-purple">AI</div>
        </div>
        
        {/* Animated pulse ring */}
        <div className="absolute inset-0 border-4 border-theme-purple rounded-full animate-ping opacity-30"></div>
        
        {/* Circular Progress Bar usando SVG (Persuasion Level) */}
        {persuasionLevel > 0 && (
          <svg 
            className="absolute inset-0 z-20 w-full h-full" 
            viewBox="0 0 100 100"
            style={{
              transform: 'rotate(-90deg)',
              filter: "drop-shadow(0 0 8px rgba(192, 90, 255, 0.5))"
            }}
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
              stroke={getPersuasionColor()}
              strokeWidth="4"
              strokeDasharray="283"
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className="transition-all duration-300 ease-in-out"
            />
          </svg>
        )}
      </div>
      
      {/* Persuasion Level Percentage */}
      {persuasionLevel > 0 && (
        <div className="mb-2 text-sm font-medium">
          <span className="text-white/70">Persuasão: </span>
          <span 
            className={
              persuasionLevel < 30 
                ? "text-red-500" 
                : persuasionLevel < 70 
                  ? "text-yellow-500" 
                  : "text-green-500"
            }
          >
            {persuasionLevel}%
          </span>
        </div>
      )}
      
      <h2 className="text-xl md:text-2xl font-bold text-theme-light-purple">Convença a IA</h2>
      <div className="flex flex-col items-center">
        <p className="text-sm text-theme-soft-purple opacity-80 mb-2">
          Será que você consegue?
        </p>
        <UserEmail />
      </div>
    </div>
  );
};

export default AiAvatar;