
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
  attemptNumber?: number;
  prizeNumber?: number;
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
        return { text: 'Convencido', color: 'text-violet-400', bgColor: 'bg-violet-500/10' };
      case 'failed':
        return { text: 'Falhado', color: 'text-red-400', bgColor: 'bg-red-500/10' };
      case 'abandoned':
        return { text: 'Abandonado', color: 'text-slate-400', bgColor: 'bg-slate-500/10' };
      default:
        return { text: 'Desconhecido', color: 'text-violet-400', bgColor: 'bg-violet-500/10' };
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
      {/* Header */}
      <div className="w-full px-4 py-6 border-b border-slate-700/50">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            {onGoBack && (
              <button
                onClick={onGoBack}
                className="bg-slate-600/40 hover:bg-slate-600/60 border border-slate-500/20 hover:border-slate-400/40 text-slate-300 hover:text-slate-200 font-medium py-2.5 px-4 rounded-xl transition-all duration-300 flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Voltar</span>
              </button>
            )}

            <h1 className="text-2xl md:text-3xl font-bold text-violet-100">
              Histórico de Tentativas
            </h1>
          </div>

          {/* User Info Card */}
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl p-6 border border-violet-500/10">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold text-violet-100">{userName}</h2>
                <p className="text-violet-300/80 text-sm">{userEmail}</p>
              </div>

              <div className="flex gap-3">
                {onUpdateData && (
                  <button
                    onClick={onUpdateData}
                    className="bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/20 hover:border-violet-400/40 text-violet-400 hover:text-violet-300 font-medium py-2.5 px-4 rounded-xl transition-all duration-300 flex items-center gap-2 text-sm"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">Atualizar</span>
                  </button>
                )}

                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="bg-red-500/15 hover:bg-red-500/25 border border-red-500/20 hover:border-red-400/40 text-red-400 hover:text-red-300 font-medium py-2.5 px-4 rounded-xl transition-all duration-300 flex items-center gap-2 text-sm"
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

      {/* Attempts List */}
      <div className="w-full px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Clock className="h-5 w-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-violet-100">
              {attempts.length} tentativa{attempts.length !== 1 ? 's' : ''} encontrada{attempts.length !== 1 ? 's' : ''}
            </h2>
          </div>

          <div className="space-y-4">
            {attempts.map((attempt) => {
              const statusInfo = getStatusText(attempt.status);
              const prizeStatusInfo = attempt.prizeStatus ? getPrizeStatusText(attempt.prizeStatus) : null;

              return (
                <div
                  key={attempt.id}
                  className="bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/30 hover:border-violet-500/30 transition-all duration-300 group"
                >
                  <div className="p-6">
                    {/* Header da tentativa */}
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
                      <div className="flex-1">
                        {/* Número da tentativa */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-violet-500/20 rounded-lg px-3 py-1.5 border border-violet-500/30">
                            <span className="text-violet-300 font-semibold text-sm">
                              Tentativa #{attempt.attemptNumber || attempt.id}
                            </span>
                          </div>
                          
                          {attempt.status === 'convinced' && attempt.prizeNumber && (
                            <div className="bg-amber-500/20 rounded-lg px-3 py-1.5 border border-amber-500/30">
                              <span className="text-amber-300 font-semibold text-sm">
                                Prêmio #{attempt.prizeNumber}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Data e hora */}
                        <div className="flex items-center gap-3 mb-3">
                          <Calendar className="h-4 w-4 text-violet-400/70" />
                          <span className="text-sm font-medium text-violet-300">{attempt.date}</span>
                          <span className="text-violet-500/50">•</span>
                          <span className="text-sm text-slate-400">{attempt.time}</span>
                          
                          {attempt.duration && (
                            <>
                              <span className="text-violet-500/50">•</span>
                              <div className="flex items-center gap-1.5">
                                <Timer className="h-3.5 w-3.5 text-slate-500" />
                                <span className="text-sm text-slate-400">{attempt.duration}</span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Status badge */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${statusInfo.bgColor} border border-current/20`}>
                            <div className={`w-2 h-2 rounded-full ${statusInfo.color.replace('text-', 'bg-')}`}></div>
                            <span className={`text-sm font-medium ${statusInfo.color}`}>
                              {statusInfo.text}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Certificado (se existir) */}
                      {attempt.certificateNumber && (
                        <div className="flex-shrink-0 bg-slate-700/40 rounded-xl px-4 py-2.5 border border-slate-600/30">
                          <div className="text-xs text-slate-400 mb-1">Certificado</div>
                          <div className="text-sm font-mono text-violet-300">{attempt.certificateNumber}</div>
                        </div>
                      )}
                    </div>

                    {/* Informações do prêmio */}
                    {attempt.prizeAmount && (
                      <div className="bg-slate-700/20 rounded-xl p-4 border border-slate-600/20">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <Trophy className="h-5 w-5 text-violet-400" />
                            <div>
                              <div className="text-sm text-slate-400 mb-1">
                                {attempt.prizeNumber ? `Prêmio #${attempt.prizeNumber} Conquistado` : 'Valor do Prêmio'}
                              </div>
                              <div className="text-xl font-bold text-violet-400">
                                {formatPrize(attempt.prizeAmount)}
                              </div>
                              {attempt.prizeNumber && (
                                <div className="text-xs text-amber-400 mt-1">
                                  Conquistado na tentativa #{attempt.attemptNumber || attempt.id}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col sm:items-end gap-3">
                            {prizeStatusInfo && prizeStatusInfo.text && (
                              <div className="text-right">
                                <div className="text-xs text-slate-500 mb-1">Status do Prêmio</div>
                                <span className={`text-sm font-medium ${prizeStatusInfo.color}`}>
                                  {prizeStatusInfo.text}
                                </span>
                              </div>
                            )}

                            {attempt.prizeStatus === 'claimable' && onClaimPrize && (
                              <button
                                onClick={() => handleClaimPrize(attempt.id)}
                                disabled={claimingPrize === attempt.id}
                                className="bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 hover:border-violet-400/50 text-violet-400 hover:text-violet-300 font-semibold py-2.5 px-5 rounded-xl transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] justify-center"
                              >
                                {claimingPrize === attempt.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-violet-400"></div>
                                    <span>Solicitando...</span>
                                  </>
                                ) : (
                                  <>
                                    <Trophy className="h-4 w-4" />
                                    <span>Solicitar</span>
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
              <div className="text-center py-16">
                <div className="bg-slate-800/30 rounded-2xl p-12 border border-slate-700/30">
                  <Clock className="h-16 w-16 text-slate-500 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-slate-300 mb-3">
                    Nenhuma tentativa encontrada
                  </h3>
                  <p className="text-slate-400 max-w-md mx-auto">
                    Quando você fizer suas primeiras tentativas de convencimento, elas aparecerão aqui com todos os detalhes.
                  </p>
                </div>
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
      certificateNumber: 'CERT-2024-001542',
      attemptNumber: 250,
      prizeNumber: 12
    },
    {
      id: 2,
      date: '14/12/2024',
      time: '09:15',
      status: 'failed',
      duration: '15m 00s',
      attemptNumber: 249
    },
    {
      id: 3,
      date: '13/12/2024',
      time: '16:22',
      status: 'convinced',
      prizeAmount: 8500,
      prizeStatus: 'claimable',
      duration: '12m 30s',
      certificateNumber: 'CERT-2024-001498',
      attemptNumber: 248,
      prizeNumber: 11
    },
    {
      id: 4,
      date: '12/12/2024',
      time: '11:08',
      status: 'abandoned',
      duration: '3m 12s',
      attemptNumber: 247
    },
    {
      id: 5,
      date: '11/12/2024',
      time: '20:45',
      status: 'convinced',
      prizeAmount: 15200,
      prizeStatus: 'processing',
      duration: '6m 55s',
      certificateNumber: 'CERT-2024-001401',
      attemptNumber: 246,
      prizeNumber: 10
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
