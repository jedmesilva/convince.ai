import React, { useState } from 'react';
import { User, Mail, Clock, CheckCircle, XCircle, StopCircle, Gift, AlertCircle, Trophy, Calendar, LogOut, ArrowLeft, Settings } from 'lucide-react';

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'convinced':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-400" />;
      case 'abandoned':
        return <StopCircle className="h-5 w-5 text-yellow-400" />;
      default:
        return <Clock className="h-5 w-5 text-violet-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'convinced':
        return { text: 'Convencido', color: 'text-green-400' };
      case 'failed':
        return { text: 'Falhado', color: 'text-red-400' };
      case 'abandoned':
        return { text: 'Abandonado', color: 'text-yellow-400' };
      default:
        return { text: 'Desconhecido', color: 'text-violet-400' };
    }
  };

  const getPrizeStatusText = (status: string) => {
    switch (status) {
      case 'claimable':
        return { text: 'Disponível para saque', color: 'text-green-400' };
      case 'pending':
        return { text: 'Solicitação pendente', color: 'text-yellow-400' };
      case 'processing':
        return { text: 'Em andamento', color: 'text-blue-400' };
      case 'received':
        return { text: 'Recebido', color: 'text-green-400' };
      default:
        return { text: '', color: '' };
    }
  };

  const handleClaimPrize = async (attemptId: number) => {
    setClaimingPrize(attemptId);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simula API call
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
      {/* Header do usuário */}
      <div className="w-full px-4 py-6 border-b border-slate-700">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-700/30 backdrop-blur-sm rounded-2xl p-6 border border-violet-500/20">
            {/* Botão de Voltar e Título */}
            <div className="flex items-center gap-4 mb-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-violet-400" />
                <div>
                  <p className="text-violet-100/80 text-sm">Nome</p>
                  <p className="text-violet-100 font-semibold">{userName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-violet-400" />
                <div>
                  <p className="text-violet-100/80 text-sm">Email</p>
                  <p className="text-violet-100 font-semibold">{userEmail}</p>
                </div>
              </div>
            </div>

            {/* Botões de ação - Atualizar Dados à esquerda, Logout à direita */}
            <div className="mt-4 flex justify-between items-center">
              {/* Botão Atualizar Dados à esquerda */}
              {onUpdateData && (
                <button
                  onClick={() => {
                    console.log('🔄 Botão Atualizar Dados clicado');
                    if (onUpdateData) {
                      onUpdateData();
                    } else {
                      console.log('⚠️ Função onUpdateData não definida');
                    }
                  }}
                  className="bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 hover:border-violet-400 text-violet-400 hover:text-violet-300 font-medium py-2 px-4 rounded-lg transition-all duration-300 flex items-center gap-2 text-sm sm:text-base"
                >
                  <Settings className="h-4 w-4" />
                  <span>Atualizar Dados</span>
                </button>
              )}

              {/* Spacer se não tiver botão de atualizar dados */}
              {!onUpdateData && <div></div>}

              {/* Botão Logout à direita */}
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-400 text-red-400 hover:text-red-300 font-semibold py-2 px-4 rounded-lg transition-all duration-300 flex items-center gap-2 text-sm sm:text-base"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </button>
              )}
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
                <div key={attempt.id} className="bg-slate-700/30 backdrop-blur-sm rounded-xl border border-violet-500/20 overflow-hidden">
                  <div className="p-6">
                    {/* Header da tentativa - Responsivo */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="bg-violet-500/20 rounded-lg px-3 py-2 flex-shrink-0">
                          <span className="text-violet-200 font-bold">#{attempt.id}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-violet-100 font-semibold">Tentativa {attempt.id}</p>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-violet-300">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{attempt.date} às {attempt.time}</span>
                            </div>
                            {attempt.duration && (
                              <div className="flex items-center gap-2">
                                <span className="hidden sm:inline">•</span>
                                <span className="truncate">Duração: {attempt.duration}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status da tentativa - Responsivo */}
                      <div className="flex items-center justify-start sm:justify-end gap-2 flex-shrink-0">
                        {getStatusIcon(attempt.status)}
                        <span className={`font-semibold text-sm sm:text-base ${statusInfo.color}`}>
                          {statusInfo.text}
                        </span>
                      </div>
                    </div>

                    {/* Prêmio (se convencido) - Responsivo */}
                    {attempt.status === 'convinced' && attempt.prizeAmount && (
                      <div className="bg-slate-600/50 rounded-lg p-4 mt-4">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-green-500/20 rounded-lg p-2 flex-shrink-0">
                              <Trophy className="h-5 w-5 text-green-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-green-400 font-semibold text-sm sm:text-base">
                                {(() => {
                                  // Calcula quantos prêmios foram conquistados até esta tentativa (incluindo ela)
                                  const prizeNumber = attempts
                                    .filter(a => a.status === 'convinced' && a.id <= attempt.id)
                                    .length;
                                  return `${prizeNumber}° Prêmio Conquistado`;
                                })()}
                              </p>
                              <p className="text-violet-100 text-xl sm:text-2xl font-bold">
                                {formatPrize(attempt.prizeAmount)}
                              </p>
                              {attempt.certificateNumber && (
                                <p className="text-violet-300 text-xs sm:text-sm break-all">
                                  Certificado: #{attempt.certificateNumber}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Status do prêmio e botão - Responsivo */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:flex-col lg:items-end lg:text-right">
                            {prizeStatusInfo && (
                              <p className={`text-sm font-medium ${prizeStatusInfo.color} lg:mb-2`}>
                                {prizeStatusInfo.text}
                              </p>
                            )}

                            {attempt.prizeStatus === 'claimable' && (
                              <button
                                onClick={() => handleClaimPrize(attempt.id)}
                                disabled={claimingPrize === attempt.id}
                                className="bg-violet-400 hover:bg-violet-300 disabled:bg-violet-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto"
                              >
                                {claimingPrize === attempt.id ? (
                                  <>
                                    <AlertCircle className="h-4 w-4 animate-spin" />
                                    <span className="hidden sm:inline">Solicitando...</span>
                                    <span className="sm:hidden">...</span>
                                  </>
                                ) : (
                                  <>
                                    <Gift className="h-4 w-4" />
                                    <span className="hidden sm:inline">Solicitar Prêmio</span>
                                    <span className="sm:hidden">Solicitar</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {attempts.length === 0 && (
              <div className="bg-slate-700/30 backdrop-blur-sm rounded-xl p-8 border border-violet-500/20 text-center">
                <Clock className="h-12 w-12 text-violet-400 mx-auto mb-4" />
                <p className="text-violet-100 text-lg font-semibold mb-2">Nenhuma tentativa ainda</p>
                <p className="text-violet-300">Você ainda não fez nenhuma tentativa de convencer o Vince!</p>
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
    // Aqui você implementaria a navegação real (ex: router.back(), navigate(-1), etc.)
  };

  const handleLogout = () => {
    if (confirm('Tem certeza que deseja sair?')) {
      console.log('Usuário saiu do sistema');
      // Aqui você implementaria a lógica real de logout
    }
  };

  const handleUpdateData = () => {
    console.log('Navegando para tela de atualização de dados');
    // Aqui você implementaria a navegação para a tela de atualização de dados
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

export default UserAttemptsHistoryDemo;