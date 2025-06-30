import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, Plus, Minus, CreditCard, QrCode, Clock, ShoppingCart, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../lib/api';

interface CheckoutProps {
  onPaymentSuccess?: () => void;
}

const PaymentCheckout: React.FC<CheckoutProps> = ({ onPaymentSuccess }) => {
  const { isAuthenticated, user, checkEmail, login, register } = useAuth();
  
  // Definir o passo inicial baseado na autenticação
  const [currentStep, setCurrentStep] = useState<'email' | 'login' | 'register' | 'payment'>('email');
  const [email, setEmail] = useState('');
  const [hasAccount, setHasAccount] = useState(false);
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });
  const [attempts, setAttempts] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userTimeBalance, setUserTimeBalance] = useState<number | null>(null);

  const pricePerAttempt = 1;
  const minutesPerAttempt = 2.5;
  const totalPrice = attempts * pricePerAttempt;
  const totalTime = attempts * minutesPerAttempt;

  // Inicializar o passo correto baseado no status de autenticação
  useEffect(() => {
    if (isAuthenticated && user) {
      // Usuário já está autenticado - vai direto para pagamento
      setCurrentStep('payment');
      setEmail(user.email);
      // Buscar saldo de tempo do usuário autenticado
      checkUserTimeBalanceAndProceed();
    } else {
      // Usuário não autenticado - começa pelo email
      setCurrentStep('email');
    }
  }, [isAuthenticated, user]);

  // Função para formatar tempo em minutos
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  const adjustAttempts = (increment: boolean) => {
    setAttempts(prev => increment ? prev + 1 : Math.max(1, prev - 1));
  };

  const handleEmailSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');
    
    try {
      const result = await checkEmail(email);
      setHasAccount(result.exists);
      
      // Direcionar para o formulário correto baseado na existência da conta
      if (result.exists) {
        setCurrentStep('login'); // Usuário tem conta - formulário de login (só senha)
      } else {
        setCurrentStep('register'); // Usuário não tem conta - formulário de cadastro (nome + senha)
      }
    } catch (error) {
      console.error('Error checking email:', error);
      setError('Erro ao verificar email. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && email) {
      handleEmailSubmit();
    }
  };

  // Função para formatar tempo em segundos para formato legível
  const formatTimeBalance = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} segundo${seconds !== 1 ? 's' : ''}`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (remainingSeconds === 0) {
      return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    }
    return `${minutes} minuto${minutes !== 1 ? 's' : ''} e ${remainingSeconds} segundo${remainingSeconds !== 1 ? 's' : ''}`;
  };

  // Função para obter mensagem contextual baseada no saldo de tempo
  const getTimeBalanceMessage = (): string => {
    if (userTimeBalance === null) return '';
    
    if (userTimeBalance === 0) {
      return 'Você não tem tempo disponível para tentativas, considere adicionar tempo para tentar convencer o Vince';
    }
    
    if (userTimeBalance < 60) {
      return `Você tem ${formatTimeBalance(userTimeBalance)} disponível, considere adicionar mais tempo para ter chance de convencer o Vince`;
    }
    
    return `Você tem ${formatTimeBalance(userTimeBalance)} disponível`;
  };

  // Função para verificar saldo de tempo após login/cadastro bem-sucedido
  const checkUserTimeBalanceAndProceed = async () => {
    console.log('Verificando saldo de tempo para usuário:', user?.id);
    
    if (!user?.id) {
      console.log('Usuário não encontrado, indo para pagamento');
      setCurrentStep('payment');
      return;
    }

    try {
      const timeBalance = await apiService.getTimeBalance(user.id);
      console.log('Saldo de tempo recebido:', timeBalance);
      
      // Armazenar o saldo de tempo do usuário para exibir na tela de pagamento
      setUserTimeBalance(timeBalance.amount_time_seconds || 0);
      console.log('userTimeBalance definido como:', timeBalance.amount_time_seconds || 0);
      
      // Sempre ir para etapa de pagamento, mas com informações contextuais sobre o saldo
      setCurrentStep('payment');
    } catch (error) {
      console.error('Erro ao verificar saldo de tempo:', error);
      // Em caso de erro, definir saldo como 0 e continuar para pagamento
      setUserTimeBalance(0);
      setCurrentStep('payment');
    }
  };

  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!password) {
      setError('Senha é obrigatória');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const success = await login(email, password);
      if (success) {
        // Após login bem-sucedido, verificar se usuário tem saldo de tempo
        await checkUserTimeBalanceAndProceed();
      } else {
        setError('Email ou senha incorretos');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Erro interno. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!name || !password) {
      setError('Nome e senha são obrigatórios');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const success = await register(email, password, name);
      if (success) {
        // Após cadastro bem-sucedido, verificar se usuário tem saldo de tempo
        await checkUserTimeBalanceAndProceed();
      } else {
        setError('Erro ao criar conta. Tente novamente.');
      }
    } catch (error) {
      console.error('Register error:', error);
      setError('Erro interno. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && password) {
      handleLoginSubmit();
    }
  };

  const handleRegisterKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name && password) {
      handleRegisterSubmit();
    }
  };

  const handlePaymentMethodSelect = (method: string) => {
    setPaymentMethod(method);
  };

  const handlePurchase = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!user || !paymentMethod) {
      setError('Usuário não autenticado ou método de pagamento não selecionado');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Calculate time in seconds (2.5 minutes per attempt)
      const timeInSeconds = attempts * minutesPerAttempt * 60;
      
      const paymentResponse = await apiService.processPayment(
        user.id,
        totalPrice,
        timeInSeconds
      );
      
      if (paymentResponse.success) {
        setLoading(false);
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
      } else {
        setError('Erro ao processar pagamento. Tente novamente.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError('Erro ao processar pagamento. Tente novamente.');
      setLoading(false);
    }
  };

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && paymentMethod === 'card') {
      const { number, name, expiry, cvv } = cardData;
      if (number && name && expiry && cvv) {
        handlePurchase();
      }
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  return (
    <div className="bg-gray-900 w-full h-full">
      {/* Layout Responsivo com scroll interno */}
      <div className="flex flex-col sm:flex-row w-full h-full overflow-y-auto">
        
        {/* Sidebar do Resumo - Desktop à esquerda, Mobile no topo */}
        <div className="sm:w-2/5 sm:min-w-[280px] bg-gradient-to-br from-slate-800 via-violet-500/20 to-slate-800 relative overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(139,92,246,0.3),transparent_70%)]" />
          
          <div className="relative p-4 sm:p-6 md:p-8">
            <div className="text-start sm:text-left mb-4 sm:mb-6">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-violet-100 mb-4 flex items-center justify-start sm:justify-start gap-3">
                <div className="bg-violet-500/20 p-2 rounded-lg">
                  <Clock className="h-6 w-6 text-violet-300" />
                </div>
                Quantas tentativas você deseja?
              </h1>
            </div>
            
            {/* Seletor de tentativas */}
            <div className="bg-slate-700/30 backdrop-blur-sm rounded-2xl p-6 border border-violet-500/20 mb-6">
              <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-4">
                  <button 
                    onClick={() => adjustAttempts(false)}
                    className="bg-violet-500/20 hover:bg-violet-500/30 p-3 rounded-lg transition-colors"
                    disabled={attempts <= 1}
                  >
                    <Minus className="h-5 w-5 text-violet-300" />
                  </button>
                  <div className="bg-violet-500/20 px-8 py-4 rounded-lg">
                    <span className="text-4xl font-bold text-violet-200">{attempts}</span>
                  </div>
                  <button 
                    onClick={() => adjustAttempts(true)}
                    className="bg-violet-500/20 hover:bg-violet-500/30 p-3 rounded-lg transition-colors"
                  >
                    <Plus className="h-5 w-5 text-violet-300" />
                  </button>
                </div>
                <p className="text-violet-300 text-sm mt-2">
                  {attempts === 1 ? '1 tentativa' : `${attempts} tentativas`}
                </p>
              </div>
            </div>
            
            {/* Resumo detalhado */}
            <div className="space-y-4">
              <div className="bg-slate-600/20 rounded-lg p-4 border border-violet-500/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-violet-300 text-sm">Tempo total</span>
                  <span className="text-violet-200 font-bold text-lg">{formatTime(totalTime)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-violet-300 text-sm">Valor total</span>
                  <span className="text-violet-200 font-bold text-2xl">${totalPrice}</span>
                </div>
              </div>
              
              <p className="text-violet-400 text-xs text-center">
                Cada tentativa custa ${pricePerAttempt} e tem duração de {minutesPerAttempt} minutos.
              </p>
            </div>
          </div>
        </div>

        {/* Área do Formulário - Desktop à direita, Mobile abaixo */}
        <div className="sm:w-3/5 bg-gray-900 flex items-center justify-center flex-grow">
          <div className="p-4 sm:p-6 md:p-8 w-full max-w-md sm:max-w-lg">
            
            {/* Etapa 1: Email */}
            {currentStep === 'email' && (
              <div className="bg-slate-800 rounded-2xl p-6 border border-violet-500/20">
                <h2 className="text-xl font-bold text-violet-100 mb-4">Digite seu e-mail</h2>
                <div className="space-y-4">
                  <div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={handleEmailKeyDown}
                      placeholder="seu@email.com"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                  {error && (
                    <div className="text-red-400 text-sm text-center">
                      {error}
                    </div>
                  )}
                  <button
                    onClick={handleEmailSubmit}
                    disabled={loading || !email}
                    className="w-full bg-violet-500 hover:bg-violet-600 disabled:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    {loading ? 'Verificando...' : 'Continuar'}
                  </button>
                </div>
              </div>
            )}

            {/* Etapa 2: Login - usuário tem conta */}
            {currentStep === 'login' && (
              <div className="bg-slate-800 rounded-2xl p-6 border border-violet-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <button 
                    onClick={() => setCurrentStep('email')}
                    className="text-slate-400 hover:text-white"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <h2 className="text-xl font-bold text-violet-100">Entre na sua conta</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full bg-slate-600 border border-slate-500 rounded-lg px-4 py-3 text-slate-300"
                    />
                  </div>
                  
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleLoginKeyDown}
                      placeholder="Sua senha"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 pr-12 text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  
                  {error && (
                    <div className="text-red-400 text-sm text-center">
                      {error}
                    </div>
                  )}
                  
                  <button
                    onClick={handleLoginSubmit}
                    disabled={loading || !password}
                    className="w-full bg-violet-500 hover:bg-violet-600 disabled:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    {loading ? 'Entrando...' : 'Entrar'}
                  </button>
                </div>
              </div>
            )}

            {/* Etapa 2: Cadastro - usuário não tem conta */}
            {currentStep === 'register' && (
              <div className="bg-slate-800 rounded-2xl p-6 border border-violet-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <button 
                    onClick={() => setCurrentStep('email')}
                    className="text-slate-400 hover:text-white"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <h2 className="text-xl font-bold text-violet-100">Criar conta</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full bg-slate-600 border border-slate-500 rounded-lg px-4 py-3 text-slate-300"
                    />
                  </div>
                  
                  <div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={handleRegisterKeyDown}
                      placeholder="Seu nome completo"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none"
                      autoFocus
                    />
                  </div>
                  
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleRegisterKeyDown}
                      placeholder="Criar senha"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 pr-12 text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  
                  {error && (
                    <div className="text-red-400 text-sm text-center">
                      {error}
                    </div>
                  )}
                  
                  <button
                    onClick={handleRegisterSubmit}
                    disabled={loading || !name || !password}
                    className="w-full bg-violet-500 hover:bg-violet-600 disabled:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    {loading ? 'Criando conta...' : 'Criar conta'}
                  </button>
                </div>
              </div>
            )}

            {/* Etapa 3: Método de pagamento */}
            {currentStep === 'payment' && !paymentMethod && (
              <div className="bg-slate-800 rounded-2xl p-6 border border-violet-500/20">
                <h2 className="text-xl font-bold text-violet-100 mb-4">Adicionar tempo para tentativas</h2>
                
                {/* Debug: Mostrar sempre para testar */}
                <div className="mb-4 p-3 bg-red-900/20 rounded-lg border border-red-500/30 text-red-300 text-xs">
                  Debug: userTimeBalance = {userTimeBalance} | user = {user?.id}
                </div>
                
                {/* Exibir informações sobre o saldo de tempo atual */}
                {userTimeBalance !== null && (
                  <div className="mb-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-violet-400" />
                      <span className="font-semibold text-violet-300">Seu tempo atual</span>
                    </div>
                    <p className="text-slate-300 text-sm mb-3">
                      {getTimeBalanceMessage()}
                    </p>
                    
                    {/* Botão para pular esta etapa */}
                    <button
                      onClick={() => {
                        if (onPaymentSuccess) {
                          onPaymentSuccess();
                        }
                      }}
                      className="w-full bg-slate-600 hover:bg-slate-500 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                      Adicionar tempo depois
                    </button>
                  </div>
                )}
              
                <div className="space-y-3">
                  <p className="text-slate-400 text-sm mb-4">
                    Escolha como adicionar mais tempo:
                  </p>
                  
                  <button
                    onClick={() => handlePaymentMethodSelect('card')}
                    className="w-full bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-violet-500 rounded-lg p-4 text-left transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-6 w-6 text-violet-400" />
                      <div>
                        <p className="font-semibold text-white">Cartão de Crédito</p>
                        <p className="text-sm text-slate-400">Pagamento instantâneo</p>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handlePaymentMethodSelect('pix')}
                    className="w-full bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-violet-500 rounded-lg p-4 text-left transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <QrCode className="h-6 w-6 text-violet-400" />
                      <div>
                        <p className="font-semibold text-white">PIX</p>
                        <p className="text-sm text-slate-400">Código gerado na próxima etapa</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Etapa 4: PIX */}
            {currentStep === 'payment' && paymentMethod === 'pix' && (
              <div className="bg-slate-800 rounded-2xl p-6 border border-violet-500/20">
                <h2 className="text-xl font-bold text-violet-100 mb-4 flex items-center gap-2">
                  <QrCode className="h-6 w-6 text-violet-400" />
                  Pagamento via PIX
                </h2>
                <div className="text-center space-y-4">
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <p className="text-slate-300">
                      Ao prosseguir, será gerado um código PIX para pagamento de <span className="font-bold text-violet-300">${totalPrice}</span>
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPaymentMethod('')}
                      className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handlePurchase}
                      disabled={loading}
                      className="flex-1 bg-violet-500 hover:bg-violet-600 disabled:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                      {loading ? 'Gerando...' : 'Gerar PIX'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Etapa 4: Cartão de Crédito */}
            {currentStep === 'payment' && paymentMethod === 'card' && (
              <div className="bg-slate-800 rounded-2xl p-6 border border-violet-500/20">
                <h2 className="text-xl font-bold text-violet-100 mb-4 flex items-center gap-2">
                  <CreditCard className="h-6 w-6 text-violet-400" />
                  Dados do Cartão
                </h2>
                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      value={cardData.number}
                      onChange={(e) => setCardData({...cardData, number: formatCardNumber(e.target.value)})}
                      onKeyDown={handleCardKeyDown}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none"
                      required
                    />
                  </div>
                  
                  <div>
                    <input
                      type="text"
                      value={cardData.name}
                      onChange={(e) => setCardData({...cardData, name: e.target.value.toUpperCase()})}
                      onKeyDown={handleCardKeyDown}
                      placeholder="NOME NO CARTÃO"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={cardData.expiry}
                      onChange={(e) => setCardData({...cardData, expiry: formatExpiry(e.target.value)})}
                      onKeyDown={handleCardKeyDown}
                      placeholder="MM/AA"
                      maxLength={5}
                      className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none"
                      required
                    />
                    <input
                      type="text"
                      value={cardData.cvv}
                      onChange={(e) => setCardData({...cardData, cvv: e.target.value.replace(/\D/g, '')})}
                      onKeyDown={handleCardKeyDown}
                      placeholder="CVV"
                      maxLength={4}
                      className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none"
                      required
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('')}
                      className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handlePurchase}
                      disabled={loading}
                      className="flex-1 bg-violet-500 hover:bg-violet-600 disabled:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                      {loading ? 'Processando...' : `Pagar $${totalPrice}`}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCheckout;