
import React from 'react';

const AiAvatar = () => {
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
      </div>
    </div>
  );
};

export default AiAvatar;
