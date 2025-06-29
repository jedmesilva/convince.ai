
import React from 'react';

const AiAvatar: React.FC = () => {
  return (
    <div className="relative">
      <div className="size-24 md:size-32 rounded-full bg-gradient-to-r from-theme-purple to-theme-vivid-purple p-1">
        <div className="w-full h-full rounded-full bg-theme-dark-purple flex items-center justify-center">
          <span className="text-3xl md:text-4xl">🤖</span>
        </div>
      </div>
    </div>
  );
};

export default AiAvatar;
