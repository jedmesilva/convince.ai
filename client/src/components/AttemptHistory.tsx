import React, { useState } from 'react';
import { User, Mail, ArrowLeft, Clock, Trophy, Calendar, Timer, LogOut, Settings } from 'lucide-react';

interface AttemptHistory {
  id: number;
  date: string;
  time: string;
  status: 'convinced' | 'failed' | 'abandoned';
  prizeAmount?: number;
  prizeStatus?: 'claimable' | 'pending' | 'processing' | 'received';
  duration?: string;
  certificateNumber?: string;
}

interface UserAttemptsHistoryProps {
  userName: string;
  userEmail: string;
  attempts: AttemptHistory[];
  onClaimPrize?: (attemptId: number) => void;
  onLogout?: () => void;
  onGoBack?: () => void;
  onUpdateData?: () => void;
  className?: string;
}

const UserAttemptsHistory: React.FC<UserAttemptsHistoryProps> = ({
  userName,
  userEmail,
  attempts,
  onClaimPrize,
  onLogout,
  onGoBack,
  onUpdateData,
  className = ''
}) => {
  const [claimingPrize, setClaimingPrize] = useState<number | null>(null);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'convinced':
        return { text: 'Convencido', color: 'text-violet-400' };
      case 'failed':
        return { text: 'Falhado', color: 'text-red-400' };
      case 'abandoned':
        return { text: 'Abandonado', color: 'text-slate-400' };
      default:
        return { text: 'Desconhecido', color: 'text-violet-400' };
    }
  };

  const getPrizeStatusText = (status: string) => {
    switch (status) {
      case 'claimable':
        return { text: 'Disponível para saque', color: 'text-violet-300' };
      case 'pending':
        return { text: 'Solicitação pendente', color: 'text-slate-400' };
      case 'processing':
        return { text: 'Em andamento', color: 'text-slate-400' };
      case 'received':
        return { text: 'Recebido', color: 'text-slate-400' };
      default:
        return { text: '', color: '' };
    }
  };

  const handleClaimPrize = async (attemptId: number) => {
    setClaimingPrize(attemptId);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      onClaimPrize?.(attemptId);
    } finally {
      setClaimingPrize(null);
    }
  };

  const formatPrize = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className={`min-h-screen bg-gray-900 ${className}`}>
      {/* Header com título e botão voltar */}
      <div className="w-full px-4 py-6 border-b border-slate-700">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            {onGoBack && (
              <button
                onClick={onGoBack}
                className="bg-slate-600/50 hover:bg-slate-600/70 border border-slate-500/30 hover:border-slate-400 text-slate-300 hover:text-slate-200 font-medium py-2 px-3 rounded-lg transition-all duration-300 flex items-center gap-2 text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Voltar</span>
              </button>
            )}

            <h1 className="text-2xl md:text-3xl font-bold text-violet-100">
              Meu Histórico de Tentativas
            </h1>
          </div>

          {/* Seção do usuário limpa */}
          <div className="bg-slate-700/30 backdrop-blur-sm rounded-2xl p-6 border border-violet-500/20">
            <div className="flex justify-between items-start">
              {/* Informações do usuário à esquerda */}
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold text-violet-100">{userName}</h2>
                <p className="text-violet-300 text-sm">{userEmail}</p>
              </div>

              {/* Botões de ação à direita */}
              <div className="flex gap-3">
                {onUpdateData && (
                  <button
                    onClick={onUpdateData}
                    className="bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 hover:border-violet-400 text-violet-400 hover:text-violet-300 font-medium py-2 px-4 rounded-lg transition-all duration-300 flex items-center gap-2 text-sm"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">Atualizar Dados</span>
                  </button>
                )}

                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-400 text-red-400 hover:text-red-300 font-semibold py-2 px-4 rounded-lg transition-all duration-300 flex items-center gap-2 text-sm"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Sair</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de tentativas */}
      <div className="w-full px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-violet-100 mb-6 flex items-center gap-3">
            <Clock className="h-6 w-6 text-violet-400" />
            Minhas Tentativas ({attempts.length})
          </h2>

          <div className="space-y-4">
            {attempts.map((attempt) => {
              const statusInfo = getStatusText(attempt.status);
              const prizeStatusInfo = attempt.prizeStatus ? getPrizeStatusText(attempt.prizeStatus) : null;

              return (
                <div
                  key={attempt.id}
                  className="bg-slate-700/30 backdrop-blur-sm rounded-xl p-6 border border-violet-500/20 hover:border-violet-500/30 transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Informações principais */}
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2 text-violet-300">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm font-medium">{attempt.date}</span>
                          <span className="text-violet-400">•</span>
                          <span className="text-sm">{attempt.time}</span>
                        </div>
                        
                        {attempt.duration && (
                          <div className="flex items-center gap-2 text-slate-400">
                            <Timer className="h-4 w-4" />
                            <span className="text-sm">{attempt.duration}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-slate-300 font-medium">Status:</span>
                        <span className={`font-semibold ${statusInfo.color}`}>
                          {statusInfo.text}
                        </span>
                      </div>

                      {attempt.prizeAmount && (
                        <div className="flex items-center gap-2 mb-2">
                          <Trophy className="h-4 w-4 text-violet-400" />
                          <span className="text-slate-300 font-medium">Prêmio:</span>
                          <span className="text-violet-400 font-bold">
                            {formatPrize(attempt.prizeAmount)}
                          </span>
                        </div>
                      )}

                      {prizeStatusInfo && prizeStatusInfo.text && (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-300 font-medium">Status do Prêmio:</span>
                          <span className={`font-semibold ${prizeStatusInfo.color}`}>
                            {prizeStatusInfo.text}
                          </span>
                        </div>
                      )}

                      {attempt.certificateNumber && (
                        <div className="mt-2 text-sm text-slate-400">
                          <span className="font-medium">Certificado:</span> {attempt.certificateNumber}
                        </div>
                      )}
                    </div>

                    {/* Botões de ação */}
                    {attempt.prizeStatus === 'claimable' && onClaimPrize && (
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => handleClaimPrize(attempt.id)}
                          disabled={claimingPrize === attempt.id}
                          className="bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 hover:border-violet-400 text-violet-400 hover:text-violet-300 font-semibold py-2 px-4 rounded-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {claimingPrize === attempt.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-violet-400"></div>
                              <span>Solicitando...</span>
                            </>
                          ) : (
                            <>
                              <Trophy className="h-4 w-4" />
                              <span>Solicitar Prêmio</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {attempts.length === 0 && (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-300 mb-2">
                  Nenhuma tentativa encontrada
                </h3>
                <p className="text-slate-400">
                  Suas tentativas de convencimento aparecerão aqui.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de exemplo com dados mock
const UserAttemptsHistoryDemo: React.FC = () => {
  const [attempts, setAttempts] = useState<AttemptHistory[]>([
    {
      id: 1,
      date: '15/12/2024',
      time: '14:30',
      status: 'convinced',
      prizeAmount: 12750,
      prizeStatus: 'received',
      duration: '8m 45s',
      certificateNumber: 'CERT-2024-001542'
    },
    {
      id: 2,
      date: '14/12/2024',
      time: '09:15',
      status: 'failed',
      duration: '15m 00s'
    },
    {
      id: 3,
      date: '13/12/2024',
      time: '16:22',
      status: 'convinced',
      prizeAmount: 8500,
      prizeStatus: 'claimable',
      duration: '12m 30s',
      certificateNumber: 'CERT-2024-001498'
    },
    {
      id: 4,
      date: '12/12/2024',
      time: '11:08',
      status: 'abandoned',
      duration: '3m 12s'
    },
    {
      id: 5,
      date: '11/12/2024',
      time: '20:45',
      status: 'convinced',
      prizeAmount: 15200,
      prizeStatus: 'processing',
      duration: '6m 55s',
      certificateNumber: 'CERT-2024-001401'
    }
  ]);

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

  const handleGoBack = () => {
    console.log('Voltando para página anterior');
    const event = new CustomEvent('goBackRequested');
    window.dispatchEvent(event);
  };

  const handleLogout = () => {
    console.log('Solicitando logout');
    const event = new CustomEvent('logoutRequested');
    window.dispatchEvent(event);
  };

  const handleUpdateData = () => {
    console.log('Navegando para tela de atualização de dados');
    const event = new CustomEvent('updateDataRequested');
    window.dispatchEvent(event);
  };

  return (
    <UserAttemptsHistory
      userName="Maria Silva"
      userEmail="maria.silva@email.com"
      attempts={attempts}
      onClaimPrize={handleClaimPrize}
      onLogout={handleLogout}
      onGoBack={handleGoBack}
      onUpdateData={handleUpdateData}
    />
  );
};

export { UserAttemptsHistory };
export default UserAttemptsHistoryDemo;