
import React, { useState, useEffect } from 'react';
import UserAttemptsHistoryDemo from '../components/AttemptHistory';
import UserDataUpdate from '../components/UserDataUpdate';

// Tipos para as telas disponíveis
type ScreenType = 'history' | 'update-data';

// Dados mock do usuário (você pode substituir pela sua lógica de autenticação)
const MOCK_USER_DATA = {
  name: 'Maria Silva',
  email: 'maria.silva@email.com'
};

// Dados mock das tentativas (você pode substituir pela sua lógica de API)
const MOCK_ATTEMPTS = [
  {
    id: 1,
    date: '15/12/2024',
    time: '14:30',
    status: 'convinced' as const,
    prizeAmount: 12750,
    prizeStatus: 'received' as const,
    duration: '8m 45s',
    certificateNumber: 'CERT-2024-001542'
  },
  {
    id: 2,
    date: '14/12/2024',
    time: '09:15',
    status: 'failed' as const,
    duration: '15m 00s'
  },
  {
    id: 3,
    date: '13/12/2024',
    time: '16:22',
    status: 'convinced' as const,
    prizeAmount: 8500,
    prizeStatus: 'claimable' as const,
    duration: '12m 30s',
    certificateNumber: 'CERT-2024-001498'
  },
  {
    id: 4,
    date: '12/12/2024',
    time: '11:08',
    status: 'abandoned' as const,
    duration: '3m 12s'
  },
  {
    id: 5,
    date: '11/12/2024',
    time: '20:45',
    status: 'convinced' as const,
    prizeAmount: 15200,
    prizeStatus: 'processing' as const,
    duration: '6m 55s',
    certificateNumber: 'CERT-2024-001401'
  }
];

const AttemptHistoryPage: React.FC = () => {
  // Estado para controlar qual tela está ativa
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('history');
  
  // Estado para dados do usuário (pode ser atualizado)
  const [userData, setUserData] = useState(MOCK_USER_DATA);
  
  // Estado para tentativas (pode ser atualizado via API)
  const [attempts, setAttempts] = useState(MOCK_ATTEMPTS);

  // Listener para evento customizado do componente demo
  useEffect(() => {
    const handleUpdateDataRequest = () => {
      console.log('🔄 Evento customizado recebido - mudando para update-data');
      setCurrentScreen('update-data');
    };

    window.addEventListener('updateDataRequested', handleUpdateDataRequest);
    return () => window.removeEventListener('updateDataRequested', handleUpdateDataRequest);
  }, []);

  console.log('🎯 Estado atual do currentScreen no render:', currentScreen);

  // Função para navegar para a tela de atualização de dados
  const handleUpdateData = () => {
    console.log('🔄 INICIO handleUpdateData - Estado atual:', currentScreen);
    setCurrentScreen('update-data');
    console.log('✅ FIM handleUpdateData - setCurrentScreen chamado');
  };

  // Função para voltar para o histórico
  const handleGoBack = () => {
    console.log('🔙 Voltando para histórico...');
    setCurrentScreen('history');
  };

  // Função para processar logout (você pode implementar sua lógica aqui)
  const handleLogout = () => {
    if (confirm('Tem certeza que deseja sair?')) {
      // Aqui você implementaria sua lógica de logout
      console.log('Usuário saiu do sistema');
      
      // Exemplo: redirecionar para login ou página inicial
      // window.location.href = '/login';
    }
  };

  // Função para solicitar prêmio
  const handleClaimPrize = (attemptId: number) => {
    setAttempts(prevAttempts =>
      prevAttempts.map(attempt =>
        attempt.id === attemptId
          ? { ...attempt, prizeStatus: 'pending' as const }
          : attempt
      )
    );
    console.log(`Solicitando prêmio da tentativa ${attemptId}`);
  };

  // Função para atualizar dados do usuário
  const handleUserDataUpdate = (data: { name: string; password: string }) => {
    // Atualizar dados do usuário
    setUserData(prev => ({ ...prev, name: data.name }));
    
    // Aqui você faria a chamada para sua API
    console.log('Dados atualizados:', data);
    
    // Opcional: voltar para a tela de histórico após atualizar
    // setCurrentScreen('history');
  };

  // Função para deletar conta
  const handleDeleteAccount = () => {
    // Aqui você implementaria a lógica real de deleção de conta
    console.log('Conta deletada');
    
    // Exemplo: redirecionar para página inicial
    // window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Tela de Histórico de Tentativas */}
      <div className={currentScreen === 'history' ? 'block' : 'hidden'}>
        <UserAttemptsHistoryDemo />
      </div>

      {/* Tela de Atualização de Dados */}
      <div className={currentScreen === 'update-data' ? 'block' : 'hidden'}>
        <UserDataUpdate
          userName={userData.name}
          userEmail={userData.email}
          onGoBack={handleGoBack}
          onUpdateData={handleUserDataUpdate}
          onDeleteAccount={handleDeleteAccount}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default AttemptHistoryPage;
