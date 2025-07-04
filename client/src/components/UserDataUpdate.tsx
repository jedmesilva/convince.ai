import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft, Save, Trash2, AlertTriangle, CheckCircle, XCircle, LogOut, Settings } from 'lucide-react';

interface UserDataUpdateProps {
  userName: string;
  userEmail: string;
  onGoBack?: () => void;
  onUpdateData?: (data: { name: string; password: string }) => void;
  onDeleteAccount?: () => void;
  onLogout?: () => void;
  className?: string;
}

const UserDataUpdate: React.FC<UserDataUpdateProps> = ({
  userName,
  userEmail,
  onGoBack,
  onUpdateData,
  onDeleteAccount,
  onLogout,
  className = ''
}) => {
  const [formData, setFormData] = useState({
    name: userName,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpa feedback quando usuário digita
    if (feedback.type) {
      setFeedback({ type: null, message: '' });
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setFeedback({ type: 'error', message: 'Nome é obrigatório' });
      return false;
    }
    
    if (!formData.currentPassword) {
      setFeedback({ type: 'error', message: 'Senha atual é obrigatória' });
      return false;
    }
    
    if (formData.newPassword && formData.newPassword.length < 6) {
      setFeedback({ type: 'error', message: 'Nova senha deve ter pelo menos 6 caracteres' });
      return false;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setFeedback({ type: 'error', message: 'Confirmação de senha não confere' });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      // Simula API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      onUpdateData?.({
        name: formData.name,
        password: formData.newPassword || formData.currentPassword
      });
      
      setFeedback({ type: 'success', message: 'Dados atualizados com sucesso!' });
      
      // Limpa os campos de senha
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      // Fecha o modo de edição após sucesso
      setTimeout(() => {
        setIsEditing(false);
        setFeedback({ type: null, message: '' });
      }, 2000);
      
    } catch (error) {
      setFeedback({ type: 'error', message: 'Erro ao atualizar dados. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETAR CONTA') {
      setFeedback({ type: 'error', message: 'Digite "DELETAR CONTA" para confirmar' });
      return;
    }
    
    setIsLoading(true);
    try {
      // Simula API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      onDeleteAccount?.();
      setShowDeleteModal(false);
    } catch (error) {
      setFeedback({ type: 'error', message: 'Erro ao deletar conta. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="w-full px-4 py-6 border-b border-slate-700/50">
        <div className="max-w-2xl mx-auto">
          {/* Botão de Voltar e Título - Fora da seção */}
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
              Atualizar Dados
            </h1>
          </div>
          
          {/* Seção do usuário com botões de ação */}
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-violet-500/10">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-violet-500/20 rounded-xl p-3">
                  <User className="h-5 w-5 text-violet-400" />
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg md:text-xl font-bold text-violet-100">{userName}</h2>
                  <p className="text-violet-300/80 text-sm">{userEmail}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/20 hover:border-violet-400/40 text-violet-400 hover:text-violet-300 font-medium py-2.5 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm flex-1 sm:flex-none"
                >
                  <Settings className="h-4 w-4" />
                  <span>Atualizar</span>
                </button>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="bg-red-500/15 hover:bg-red-500/25 border border-red-500/20 hover:border-red-400/40 text-red-400 hover:text-red-300 font-medium py-2.5 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm flex-1 sm:flex-none"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sair</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo dinâmico */}
      <div className="w-full px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Feedback */}
          {feedback.type && (
            <div className={`mb-6 p-4 rounded-lg border flex items-center gap-3 ${
              feedback.type === 'success' 
                ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              {feedback.type === 'success' ? (
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 flex-shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Formulário de Atualização - Só aparece quando isEditing é true */}
          {isEditing && (
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-5 md:p-6 border border-slate-700/30 mb-6">
            <h2 className="text-lg md:text-xl font-bold text-violet-100 mb-6 flex items-center gap-3">
              <User className="h-5 w-5 text-violet-400" />
              Atualizar Informações
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nome */}
              <div>
                <label className="block text-violet-100 text-sm font-semibold mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600/30 rounded-xl px-4 py-3 text-violet-100 placeholder-violet-300/50 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 transition-all duration-300"
                  placeholder="Digite seu nome completo"
                  required
                />
              </div>

              {/* Senha Atual */}
              <div>
                <label className="block text-violet-100 text-sm font-semibold mb-2">
                  Senha Atual
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={formData.currentPassword}
                    onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-600/30 rounded-xl px-4 py-3 pr-12 text-violet-100 placeholder-violet-300/50 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 transition-all duration-300"
                    placeholder="Digite sua senha atual"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Nova Senha */}
              <div>
                <label className="block text-violet-100 text-sm font-semibold mb-2">
                  Nova Senha <span className="text-violet-300/70 text-xs">(deixe em branco para manter a atual)</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-600/30 rounded-xl px-4 py-3 pr-12 text-violet-100 placeholder-violet-300/50 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 transition-all duration-300"
                    placeholder="Digite uma nova senha (opcional)"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Nova Senha */}
              {formData.newPassword && (
                <div>
                  <label className="block text-violet-100 text-sm font-semibold mb-2">
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="w-full bg-slate-700/50 border border-slate-600/30 rounded-xl px-4 py-3 pr-12 text-violet-100 placeholder-violet-300/50 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 transition-all duration-300"
                      placeholder="Confirme sua nova senha"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Botões de ação */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFeedback({ type: null, message: '' });
                  }}
                  className="flex-1 bg-slate-600/50 hover:bg-slate-600/70 text-slate-300 hover:text-slate-200 font-semibold py-3 px-6 rounded-xl transition-all duration-300"
                >
                  Cancelar
                </button>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-violet-500 hover:bg-violet-600 disabled:bg-violet-600/50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      <span>Salvar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          )}

          {/* Zona de Perigo - Sempre visível */}
          <div className="bg-red-500/5 backdrop-blur-sm rounded-2xl p-5 md:p-6 border border-red-500/20">
            <h2 className="text-lg md:text-xl font-bold text-red-400 mb-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5" />
              Zona de Perigo
            </h2>
            
            <p className="text-red-300/80 mb-6 text-sm leading-relaxed">
              Esta ação é irreversível. Todos os seus dados, histórico de tentativas e prêmios serão permanentemente deletados.
            </p>
            
            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-400 text-red-400 hover:text-red-300 font-semibold py-2.5 px-4 rounded-xl transition-all duration-300 flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Deletar Conta</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Deleção */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-red-500/30">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-400" />
              <h3 className="text-xl font-bold text-red-400">Deletar Conta</h3>
            </div>
            
            <p className="text-slate-300 mb-6">
              Tem certeza que deseja deletar sua conta? Esta ação não pode ser desfeita.
            </p>
            
            <div className="mb-6">
              <label className="block text-slate-300 text-sm font-semibold mb-2">
                Digite "DELETAR CONTA" para confirmar:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
                placeholder="DELETAR CONTA"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                  setFeedback({ type: null, message: '' });
                }}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl transition-all duration-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isLoading || deleteConfirmText !== 'DELETAR CONTA'}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-600/50 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-300"
              >
                {isLoading ? 'Deletando...' : 'Deletar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de exemplo
const UserDataUpdateDemo: React.FC = () => {
  const handleGoBack = () => {
    console.log('Voltando para o histórico de tentativas');
  };

  const handleUpdateData = (data: { name: string; password: string }) => {
    console.log('Dados atualizados:', data);
    // Aqui você faria a chamada para sua API
  };

  const handleDeleteAccount = () => {
    console.log('Conta deletada');
    // Aqui você faria a chamada para deletar a conta e redirecionar para login
  };

  const handleLogout = () => {
    console.log('Solicitando logout');
    const event = new CustomEvent('logoutRequested');
    window.dispatchEvent(event);
  };

  return (
    <UserDataUpdate
      userName="Maria Silva"
      userEmail="maria.silva@email.com"
      onGoBack={handleGoBack}
      onUpdateData={handleUpdateData}
      onDeleteAccount={handleDeleteAccount}
      onLogout={handleLogout}
    />
  );
};

export { UserDataUpdate };
export default UserDataUpdateDemo;