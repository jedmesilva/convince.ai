import React from 'react';

const AIRepresentation: React.FC = () => {
  return (
    <div className="flex flex-col items-center mb-8">
      <div className="ai-circle flex items-center justify-center w-28 h-28 bg-[#0A0A0A] rounded-full border-2 border-primary">
        <span className="text-4xl font-bold text-white">AI</span>
      </div>
      <div className="text-center mt-4">
        <p className="text-gray-300 text-sm">Convença a IA</p>
        <p className="text-gray-300 text-sm">Será que você consegue?</p>
      </div>
    </div>
  );
};

export default AIRepresentation;
