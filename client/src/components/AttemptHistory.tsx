
import React, { useState } from 'react';
import { User, Mail, ArrowLeft, Clock, Trophy, Calendar, Timer, ChevronRight } from 'lucide-react';

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
  onGoBack?: () => void;
  onUpdateData?: () => void;
  className?: string;
}

const UserAttemptsHistory: React.FC<UserAttemptsHistoryProps> = ({
  userName,
  userEmail,
  attempts,
  onClaimPrize,
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
        <div className="max-w-4xl mx-auto">
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

            <h1 className="text-xl md:text-2xl font-bold text-violet-100">
              Histórico de Tentativas
            </h1>
          </div>

          {/* Card do usuário clicável */}
          <button
            onClick={onUpdateData}
            className="w-full bg-slate-800/40 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-violet-500/10 hover:bg-slate-800/60 hover:border-violet-500/20 transition-all duration-300 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-violet-500/20 rounded-xl p-3">
                  <User className="h-5 w-5 text-violet-400" />
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <h2 className="text-lg md:text-xl font-bold text-violet-100">{userName}</h2>
                  <p className="text-violet-300/80 text-sm">{userEmail}</p>
                </div>
              </div>
              
              <div className="flex-shrink-0">
                <div className="bg-violet-500/20 rounded-lg p-2 group-hover:bg-violet-500/30 transition-all duration-300">
                  <ChevronRight className="h-4 w-4 text-violet-400" />
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Attempts List */}
      <div className="w-full px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Clock className="h-5 w-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-violet-100">
              {attempts.length} tentativa{attempts.length !== 1 ? 's' : ''} encontrada{attempts.length !== 1 ? 's' : ''}
            </h2>
          </div>

          <div className="space-y-6">
            {attempts.map((attempt, index) => {
              const statusInfo = getStatusText(attempt.status);
              const prizeStatusInfo = attempt.prizeStatus ? getPrizeStatusText(attempt.prizeStatus) : null;
              const isSuccess = attempt.status === 'convinced';
              const attemptNumber = attempt.attemptNumber || attempt.id;

              return (
                <div
                  key={attempt.id}
                  className={`transform transition-all duration-500 ${
                    index < 10 ? 'translate-x-0 opacity-100' : 'translate-x-0 opacity-100'
                  }`}
                >
                  <div className={`bg-slate-800/60 backdrop-blur-sm rounded-xl p-5 border-l-4 ${
                    isSuccess ? 'border-violet-500' : attempt.status === 'abandoned' ? 'border-slate-500' : 'border-red-500'
                  } hover:bg-slate-800/80 transition-all duration-300 border border-slate-700/30`}>
                    
                    {/* Layout Mobile-First */}
                    <div className="space-y-4">
                      {/* Header - Número da tentativa e status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`${
                            isSuccess ? 'bg-violet-500/20' : attempt.status === 'abandoned' ? 'bg-slate-500/20' : 'bg-red-500/20'
                          } rounded-xl px-3 py-2 flex-shrink-0`}>
                            <span className={`${
                              isSuccess ? 'text-violet-200' : attempt.status === 'abandoned' ? 'text-slate-200' : 'text-red-200'
                            } font-bold text-base`}>{attemptNumber}°</span>
                          </div>
                          
                          {/* Status visual */}
                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0">
                              {isSuccess ? (
                                <Trophy className="h-4 w-4 text-violet-400" />
                              ) : attempt.status === 'abandoned' ? (
                                <div className="h-4 w-4 rounded-full bg-slate-400"></div>
                              ) : (
                                <div className="h-4 w-4 rounded-full bg-red-400"></div>
                              )}
                            </div>
                            <span className={`font-semibold text-sm ${
                              isSuccess ? 'text-violet-400' : attempt.status === 'abandoned' ? 'text-slate-400' : 'text-red-400'
                            }`}>
                              {isSuccess ? 'Convenceu!' : attempt.status === 'abandoned' ? 'Abandonou' : 'Fracassou'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Informações da tentativa */}
                      <div className="space-y-3">
                        {/* Data e hora */}
                        <div className="flex items-center gap-2 text-slate-300">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span className="text-sm">
                            {attempt.date} às {attempt.time}
                          </span>
                        </div>
                        
                        {/* Duração e certificado */}
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          {attempt.duration && (
                            <div className="flex items-center gap-2 text-slate-400">
                              <Timer className="h-4 w-4" />
                              <span>Duração: {attempt.duration}</span>
                            </div>
                          )}
                          
                          {attempt.certificateNumber && (
                            <div className="flex items-center gap-2 text-violet-400">
                              <div className="w-4 h-4 bg-violet-400 rounded-full"></div>
                              <span className="text-xs font-mono">{attempt.certificateNumber}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Card do Prêmio - Destacado */}
                    {attempt.prizeAmount && isSuccess && (
                      <div className="mt-4 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-violet-500/10 rounded-xl p-4 border border-violet-500/20">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-violet-500/20 rounded-lg p-2">
                              <Trophy className="h-5 w-5 text-violet-400" />
                            </div>
                            <div className="flex-1">
                              <div className="text-violet-300 font-semibold text-sm mb-1">
                                {attempt.prizeNumber ? `${attempt.prizeNumber}° Prêmio Conquistado` : 'Prêmio Conquistado'}
                              </div>
                              <div className="text-violet-100 text-xl font-bold">
                                {formatPrize(attempt.prizeAmount)}
                              </div>
                              {prizeStatusInfo && prizeStatusInfo.text && (
                                <div className={`text-xs ${prizeStatusInfo.color} mt-1`}>
                                  {prizeStatusInfo.text}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Botão de solicitar prêmio se aplicável */}
                          {attempt.prizeStatus === 'claimable' && onClaimPrize && (
                            <button
                              onClick={() => handleClaimPrize(attempt.id)}
                              disabled={claimingPrize === attempt.id}
                              className="w-full bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 hover:border-violet-400/50 text-violet-400 hover:text-violet-300 font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                          )}
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
      onGoBack={handleGoBack}
      onUpdateData={handleUpdateData}
    />
  );
};

export { UserAttemptsHistory };
export default UserAttemptsHistoryDemo;
