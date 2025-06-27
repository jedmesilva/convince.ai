
import React from 'react';
import ChatConvinceAi from '../components/ChatConvinceAi';
import PrizeDisplayComponent from '../components/PrizeDisplayComponent';

const Index = () => {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <div className="h-full w-full flex flex-col md:flex-row">
        {/* PrizeDisplayComponent - à esquerda no desktop, em cima no mobile */}
        <div className="flex-1 md:flex-none md:w-1/2 overflow-auto">
          <PrizeDisplayComponent 
            prizeAmount={5400} 
            failedAttempts={540}
            winners={1}
          />
        </div>
        
        {/* ChatConvinceAi - à direita no desktop, embaixo no mobile */}
        <div className="flex-1 md:flex-none md:w-1/2 overflow-hidden">
          <ChatConvinceAi />
        </div>
      </div>
    </div>
  );
};

export default Index;
