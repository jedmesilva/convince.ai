import React, { useState } from 'react';
import { DollarSign, Plus, Minus, CreditCard, QrCode, Clock, ShoppingCart, Eye, EyeOff } from 'lucide-react';

interface CheckoutProps {
  isLoggedIn?: boolean;
  userEmail?: string;
  onPaymentSuccess?: () => void;
}

const PaymentCheckout: React.FC<CheckoutProps> = ({ isLoggedIn = false, userEmail = '', onPaymentSuccess }) => {
  const [currentStep, setCurrentStep] = useState(isLoggedIn ? 'payment' : 'email');
  const [email, setEmail] = useState(userEmail);
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

  const pricePerAttempt = 1;
  const minutesPerAttempt = 2.5;
  const totalPrice = attempts * pricePerAttempt;
  const totalTime = attempts * minutesPerAttempt;

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

  const simulateEmailCheck = async (emailValue: string) => {
    setLoading(true);
    // Simula verificação de email
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simula se o email existe (emails com "test" terão conta)
    const accountExists = emailValue.includes('test');
    setHasAccount(accountExists);
    setCurrentStep('auth');
    setLoading(false);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      simulateEmailCheck(email);
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasAccount && password) {
      setCurrentStep('payment');
    } else if (!hasAccount && name && password) {
      setCurrentStep('payment');
    }
  };

  const handlePaymentMethodSelect = (method: string) => {
    setPaymentMethod(method);
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simula processamento do pagamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (paymentMethod === 'pix') {
      alert('Código PIX gerado! QR Code disponível para pagamento.');
    } else {
      alert('Compra realizada com sucesso! Suas tentativas foram adicionadas.');
    }
    
    setLoading(false);
    
    // Chama o callback de sucesso se fornecido
    if (onPaymentSuccess) {
      onPaymentSuccess();
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
      <div className="flex flex-col lg:flex-row w-full h-full overflow-y-auto">
        
        {/* Sidebar do Resumo - Desktop à esquerda, Mobile no topo */}
        <div className="lg:w-2/5 lg:min-w-[320px] bg-gradient-to-br from-slate-800 via-violet-500/20 to-slate-800 relative overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(139,92,246,0.3),transparent_70%)]" />
          
          <div className="relative p-3 sm:p-6 md:p-8">
            <div className="text-center sm:text-left mb-4 sm:mb-6">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-violet-100 mb-4 flex items-center justify-center sm:justify-start gap-3">
                <div className="bg-violet-500/20 p-2 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-violet-300" />
                </div>
                Finalizar Compra
              </h1>
            </div>
            
            {/* Seletor de tentativas */}
            <div className="bg-slate-700/30 backdrop-blur-sm rounded-2xl p-6 border border-violet-500/20 mb-6">
              <div className="text-center mb-4">
                <p className="text-violet-300 text-sm mb-3">Quantas tentativas você deseja?</p>
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
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-violet-400" />
                    <span className="text-violet-300 text-sm">Tempo total</span>
                  </div>
                  <span className="text-violet-200 font-bold text-lg">{formatTime(totalTime)}</span>
                </div>
                <p className="text-violet-400 text-xs">Você terá esse tempo para convencer a IA</p>
              </div>
              
              <div className="bg-slate-600/20 rounded-lg p-4 border border-violet-500/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-violet-400" />
                    <span className="text-violet-300 text-sm">Valor total</span>
                  </div>
                  <span className="text-violet-200 font-bold text-2xl">${totalPrice}</span>
                </div>
                <p className="text-violet-400 text-xs">${pricePerAttempt} por tentativa</p>
              </div>
            </div>
          </div>
        </div>

        {/* Área do Formulário - Desktop à direita, Mobile abaixo */}
        <div className="lg:w-3/5 bg-gray-900 flex items-center justify-center flex-grow">
          <div className="p-4 sm:p-6 lg:p-8 w-full max-w-md lg:max-w-lg">
            
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
                      placeholder="seu@email.com"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none"
                    />
                  </div>
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

            {/* Etapa 2: Autenticação */}
            {currentStep === 'auth' && (
              <div className="bg-slate-800 rounded-2xl p-6 border border-violet-500/20">
                <h2 className="text-xl font-bold text-violet-100 mb-4">
                  {hasAccount ? 'Entre na sua conta' : 'Criar conta'}
                </h2>
                <div className="space-y-4">
                  <div>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full bg-slate-600 border border-slate-500 rounded-lg px-4 py-3 text-slate-300"
                    />
                  </div>
                  
                  {!hasAccount && (
                    <div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Seu nome completo"
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none"
                      />
                    </div>
                  )}
                  
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={hasAccount ? 'Sua senha' : 'Criar senha'}
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
                  
                  <button
                    onClick={handleAuthSubmit}
                    className="w-full bg-violet-500 hover:bg-violet-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    {hasAccount ? 'Entrar' : 'Criar conta'}
                  </button>
                </div>
              </div>
            )}

            {/* Etapa 3: Método de pagamento */}
            {currentStep === 'payment' && !paymentMethod && (
              <div className="bg-slate-800 rounded-2xl p-6 border border-violet-500/20">
                <h2 className="text-xl font-bold text-violet-100 mb-4">Escolha o método de pagamento</h2>
                <div className="space-y-3">
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
                      placeholder="MM/AA"
                      maxLength={5}
                      className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none"
                      required
                    />
                    <input
                      type="text"
                      value={cardData.cvv}
                      onChange={(e) => setCardData({...cardData, cvv: e.target.value.replace(/\D/g, '')})}
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