
import React, { useState, useEffect } from 'react';
import UserAttemptsHistoryDemo from '../components/AttemptHistory';
import { UserDataUpdate } from '../components/UserDataUpdate';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../lib/api';

// Tipos para as telas disponíveis
type ScreenType = 'history' | 'update-data';

const AttemptHistoryPage: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  
  // Estado para controlar qual tela está ativa
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('history');
  
  // Estado para tentativas (será carregado via API)
  const [attempts, setAttempts] = useState([]);
  
  // Estado para loading
  const [isLoading, setIsLoading] = useState(true);

  // Estado para modal de logout
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Carregar dados do usuário e tentativas
  useEffect(() => {
    const loadUserData = async () => {
      if (!isAuthenticated || !user) {
        // Redirecionar para login se não estiver autenticado
        window.location.href = '/';
        return;
      }

      try {
        // Para agora, vamos usar dados mockados até implementarmos a API de tentativas
        // TODO: Implementar apiService.getConvincerAttempts quando disponível
        setAttempts([]);
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [isAuthenticated, user]);

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
    
    // Usar a função logout do contexto de autenticação
    logout();
    
    // Redirecionar para página inicial
    window.location.href = '/';
  };

  // Função para solicitar prêmio
  const handleClaimPrize = (attemptId: number) => {
    console.log(`Solicitando prêmio da tentativa ${attemptId}`);
    // Implementar lógica real de solicitação de prêmio
  };

  // Função para atualizar dados do usuário
  const handleUserDataUpdate = async (data: { name: string; password: string }) => {
    if (!user) return;
    
    try {
      // TODO: Implementar atualização real via API quando disponível
      console.log('Dados atualizados:', data);
      
      // Opcional: voltar para a tela de histórico após atualizar
      // setCurrentScreen('history');
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
    }
  };

  // Função para deletar conta
  const handleDeleteAccount = () => {
    // TODO: Implementar lógica real de deleção de conta
    console.log('Conta deletada');
    
    // Exemplo: redirecionar para página inicial
    // window.location.href = '/';
  };

  // Mostrar loading enquanto carrega
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  // Mostrar erro se usuário não está autenticado
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Redirecionando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Tela de Histórico de Tentativas */}
      <div className={currentScreen === 'history' ? 'block' : 'hidden'}>
        <UserAttemptsHistoryDemo />
      </div>

      {/* Tela de Atualização de Dados */}
      <div className={currentScreen === 'update-data' ? 'block' : 'hidden'}>
        <UserDataUpdate
          userName={user.name}
          userEmail={user.email}
          onGoBack={handleGoBack}
          onUpdateData={handleUserDataUpdate}
          onDeleteAccount={handleDeleteAccount}
          onLogout={handleLogout}
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
              <h3 className="text-xl font-bold text-violet-400">Sair da Conta</h3>
            </div>
            
            <p className="text-slate-300 mb-6">
              Tem certeza que deseja sair de sua conta?
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
