
import React, { useState, useEffect } from 'react';
import UserAttemptsHistoryDemo from '../components/AttemptHistory';
import { UserDataUpdate } from '../components/UserDataUpdate';

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

  // Estado para modal de logout
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Listeners para eventos customizados do componente demo
  useEffect(() => {
    const handleUpdateDataRequest = () => {
      console.log('🔄 Evento customizado recebido - mudando para update-data');
      setCurrentScreen('update-data');
    };

    const handleGoBackRequest = () => {
      console.log('🔙 Evento customizado recebido - voltando para página anterior');
      handleGoBackToPrevious();
    };

    const handleLogoutRequest = () => {
      console.log('🚪 Evento customizado recebido - processando logout');
      handleLogout();
    };

    window.addEventListener('updateDataRequested', handleUpdateDataRequest);
    window.addEventListener('goBackRequested', handleGoBackRequest);
    window.addEventListener('logoutRequested', handleLogoutRequest);
    
    return () => {
      window.removeEventListener('updateDataRequested', handleUpdateDataRequest);
      window.removeEventListener('goBackRequested', handleGoBackRequest);
      window.removeEventListener('logoutRequested', handleLogoutRequest);
    };
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

  // Função para voltar para página anterior (do histórico)
  const handleGoBackToPrevious = () => {
    console.log('🔙 Voltando para página anterior');
    window.history.back();
  };

  // Função para processar logout
  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  // Função para confirmar logout
  const handleConfirmLogout = () => {
    console.log('Usuário confirmou logout');
    
    // Limpar dados locais se houver
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_session');
    
    // Redirecionar para página inicial
    window.location.href = '/';
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

      {/* Modal de Confirmação de Logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-violet-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-6 w-6 text-violet-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16,17 21,12 16,7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-violet-400">Sair do Sistema</h3>
            </div>
            
            <p className="text-slate-300 mb-6">
              Tem certeza que deseja sair? Você será redirecionado para a página inicial.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-slate-300 font-semibold py-2 px-4 rounded-lg transition-all duration-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 bg-violet-500 hover:bg-violet-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttemptHistoryPage;
