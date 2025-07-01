import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  // Sistema de mensagens sequenciais
  useEffect(() => {
    const showMessages = async () => {
      // Primeira mensagem
      setIsTyping(true);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1s digitando
      setIsTyping(false);
      setVisibleMessages(1);
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay
      
      // Segunda mensagem
      setIsTyping(true);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1s digitando
      setIsTyping(false);
      setVisibleMessages(2);
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay
      
      // Terceira mensagem
      setIsTyping(true);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1s digitando
      setIsTyping(false);
      setVisibleMessages(3);
    };

    showMessages();
  }, []);

  const handleGoBack = () => {
    window.history.back();
  };

  // Componente para o indicador de digitação
  const TypingIndicator = () => (
    <div className="mb-6 flex justify-start max-w-lg mx-auto animate-fade-in">
      <div className="bg-slate-700 text-white px-6 py-4 rounded-2xl rounded-bl-sm shadow-lg">
        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Digitando</span>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
      <div className="text-center max-w-2xl mx-auto">
        {/* Ícone do Vince */}
        <div className="mb-8 flex justify-center">
          <div className="w-32 h-32 rounded-3xl bg-slate-700 overflow-hidden shadow-2xl">
            <img 
              src="/Vince_Think.svg" 
              alt="Vince - Mascote" 
              className="w-full h-full object-cover rounded-3xl"
            />
          </div>
        </div>

        {/* Mensagens do Vince com sistema sequencial */}
        {visibleMessages >= 1 && (
          <div className="mb-6 flex justify-start max-w-lg mx-auto animate-fade-in">
            <div className="bg-slate-700 text-white px-6 py-4 rounded-2xl rounded-bl-sm shadow-lg">
              <p className="text-lg leading-relaxed text-left">
                <span className="text-violet-400 font-semibold">Hummm... Não tem nada por aqui!</span>
                <br />
                Você está buscando algo específico?
              </p>
            </div>
          </div>
        )}

        {visibleMessages >= 2 && (
          <div className="mb-6 flex justify-start max-w-lg mx-auto animate-fade-in">
            <div className="bg-slate-700 text-white px-6 py-4 rounded-2xl rounded-bl-sm shadow-lg">
              <p className="text-lg leading-relaxed text-left">
                Se estiver buscando informações do prêmio, é por ali{" "}
                <span className="inline-block transform rotate-12 text-2xl">👈</span>
              </p>
            </div>
          </div>
        )}

        {visibleMessages >= 3 && (
          <div className="mb-6 flex justify-start max-w-lg mx-auto animate-fade-in">
            <div className="bg-slate-700 text-white px-6 py-4 rounded-2xl rounded-bl-sm shadow-lg">
              <p className="text-lg leading-relaxed text-left">
                Se estiver buscando outra coisa é por ali também. Por que não sei se notou, mas não tem nada aqui{" "}
                <span className="text-xl">🤷🏻‍♂️</span>
              </p>
            </div>
          </div>
        )}

        {/* Indicador de digitação - agora aparece APÓS as mensagens visíveis */}
        {isTyping && <TypingIndicator />}

        {/* Código de erro estilizado com mais espaçamento */}
        <div className="mb-12 mt-16">
          <span className="text-6xl font-bold text-slate-400 bg-slate-800 px-6 py-3 rounded-2xl border border-slate-600">
            404
          </span>
        </div>

        {/* Botão Voltar */}
        <button
          onClick={handleGoBack}
          className="bg-violet-400 hover:bg-violet-300 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 text-lg flex items-center justify-center space-x-3 mx-auto shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>
      </div>
    </div>
  );
};

export default NotFound;