
import React, { useState } from 'react';
import ChatConvinceAi from '../components/ChatConvinceAi';
import PrizeDisplayComponent from '../components/PrizeDisplayComponent';

const Index = () => {
  const [activeComponent, setActiveComponent] = useState<'prize' | 'chat'>('prize');

  const handleShowChat = () => {
    setActiveComponent('chat');
  };

  const handleShowPrize = () => {
    setActiveComponent('prize');
  };

  return (
    <div className="h-dvh w-screen overflow-hidden">
      <div className="h-full w-full flex flex-col md:flex-row">
        {/* PrizeDisplayComponent - à esquerda no desktop, visível no mobile quando activeComponent === 'prize' */}
        <div className={`flex-1 md:flex-none md:w-3/5 overflow-auto ${
          activeComponent === 'prize' ? 'block' : 'hidden md:block'
        }`}>
          <PrizeDisplayComponent 
            prizeAmount={5400} 
            failedAttempts={540}
            winners={1}
            onShowChat={handleShowChat}
          />
        </div>
        
        {/* ChatConvinceAi - à direita no desktop, visível no mobile quando activeComponent === 'chat' */}
        <div className={`flex-1 md:flex-none md:w-2/5 overflow-hidden ${
          activeComponent === 'chat' ? 'block' : 'hidden md:block'
        }`}>
          <ChatConvinceAi onShowPrize={handleShowPrize} />
        </div>
      </div>
    </div>
  );
};

export default Index;
