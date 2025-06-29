
import React, { useState, useEffect } from 'react';
import ChatConvinceAi from '../components/ChatConvinceAi';
import PrizeDisplayComponent from '../components/PrizeDisplayComponent';
import { apiService, type PrizeStatistics } from '../lib/api';

const Index = () => {
  // Função para obter a tela ativa do localStorage
  const getActiveComponentFromCache = (): 'prize' | 'chat' => {
    try {
      const cached = localStorage.getItem('activeComponent');
      return (cached === 'chat' || cached === 'prize') ? cached : 'prize';
    } catch {
      return 'prize';
    }
  };

  const [activeComponent, setActiveComponent] = useState<'prize' | 'chat'>(getActiveComponentFromCache);
  const [prizeData, setPrizeData] = useState<PrizeStatistics>({
    totalAttempts: 0,
    successfulAttempts: 0,
    failedAttempts: 0,
    currentPrizeAmount: 100,
    successRate: '0.00'
  });

  // useEffect para garantir sincronização com o localStorage e carregar dados da API
  useEffect(() => {
    const cachedComponent = getActiveComponentFromCache();
    if (cachedComponent !== activeComponent) {
      setActiveComponent(cachedComponent);
    }

    // Carregar dados do prêmio da API
    const loadPrizeData = async () => {
      try {
        const statistics = await apiService.getPrizeStatistics();
        setPrizeData(statistics);
      } catch (error) {
        console.error('Erro ao carregar dados do prêmio:', error);
        // Em caso de erro, mantem os valores padrão
      }
    };

    loadPrizeData();
    
    // Atualizar dados a cada 30 segundos
    const interval = setInterval(loadPrizeData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Função para salvar no localStorage quando muda de tela
  const saveActiveComponentToCache = (component: 'prize' | 'chat') => {
    try {
      localStorage.setItem('activeComponent', component);
    } catch {
      // Falha silenciosa se localStorage não estiver disponível
    }
  };

  const handleShowChat = () => {
    setActiveComponent('chat');
    saveActiveComponentToCache('chat');
  };

  const handleShowPrize = () => {
    setActiveComponent('prize');
    saveActiveComponentToCache('prize');
  };

  return (
    <div className="h-dvh w-screen overflow-hidden">
      <div className="h-full w-full flex flex-col md:flex-row">
        {/* PrizeDisplayComponent - à esquerda no desktop, visível no mobile quando activeComponent === 'prize' */}
        <div className={`flex-1 md:flex-none md:w-3/5 overflow-y-auto scrollbar-hide ${
          activeComponent === 'prize' ? 'block' : 'hidden md:block'
        }`}>
          <PrizeDisplayComponent 
            prizeAmount={prizeData.currentPrizeAmount} 
            failedAttempts={prizeData.failedAttempts}
            winners={prizeData.successfulAttempts}
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
