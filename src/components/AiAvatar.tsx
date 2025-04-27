
import React from 'react';

interface AiAvatarProps {
  persuasionLevel: number;
}

const AiAvatar: React.FC<AiAvatarProps> = ({ persuasionLevel }) => {
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
        
        {/* Circular Progress Bar (Persuasion Level) */}
        {persuasionLevel > 0 && (
          <div className="absolute inset-0 z-20 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle 
                cx="50" 
                cy="50" 
                r="48" 
                fill="none" 
                strokeWidth="4" 
                stroke="rgba(40, 40, 45, 0.6)" 
                className="opacity-70"
              />
              <circle 
                cx="50" 
                cy="50" 
                r="48" 
                fill="none" 
                strokeWidth="4" 
                stroke={
                  persuasionLevel < 30 
                    ? "#ef4444" // red-500
                    : persuasionLevel < 70 
                      ? "#eab308" // yellow-500
                      : "#22c55e" // green-500
                }
                strokeDasharray="302"
                strokeDashoffset={302 - (302 * persuasionLevel / 100)}
                strokeLinecap="round"
                className="transform -rotate-90 origin-center transition-all duration-300 ease-out"
                style={{ filter: "drop-shadow(0 0 8px rgba(192, 90, 255, 0.5))" }}
              />
            </svg>
          </div>
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
      <p className="text-sm text-theme-soft-purple opacity-80">Será que você consegue? {userEmail}</p>
    </div>
  );
};

export default AiAvatar;
