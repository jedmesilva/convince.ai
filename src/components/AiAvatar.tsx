
import React from 'react';
import { Progress } from "./ui/progress";

interface AiAvatarProps {
  persuasionLevel: number;
}

const AiAvatar: React.FC<AiAvatarProps> = ({ persuasionLevel }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40 md:w-56 md:h-56 mb-4">
        {/* Barra de Persuasão */}
        <div className="absolute -inset-4">
          <Progress 
            value={persuasionLevel} 
            className="h-2 bg-gray-700 rounded-full transform rotate-[360deg]"
            indicatorClassName={
              persuasionLevel < 30 
                ? "bg-red-500" 
                : persuasionLevel < 70 
                  ? "bg-yellow-500" 
                  : "bg-green-500"
            }
          />
        </div>
        
        {/* Glow effect behind avatar */}
        <div className="absolute inset-0 bg-theme-vivid-purple rounded-full opacity-20 blur-xl animate-pulse"></div>
        
        {/* AI Avatar image */}
        <div className="relative z-10 w-full h-full rounded-full border-4 border-theme-purple bg-theme-dark-purple flex items-center justify-center overflow-hidden">
          <div className="text-6xl md:text-7xl text-theme-light-purple">AI</div>
        </div>
        
        {/* Animated pulse ring */}
        <div className="absolute inset-0 border-4 border-theme-purple rounded-full animate-ping opacity-30"></div>
      </div>
      <h2 className="text-xl md:text-2xl font-bold text-theme-light-purple">Convença a IA</h2>
      <p className="text-sm text-theme-soft-purple opacity-80">Nível de Persuasão: {persuasionLevel}%</p>
    </div>
  );
};

export default AiAvatar;
