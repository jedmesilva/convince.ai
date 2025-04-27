
import React, { useState } from 'react';
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";

interface PaymentPromptProps {
  onPaymentSuccess: () => void;
}

const PaymentPrompt: React.FC<PaymentPromptProps> = ({ onPaymentSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handlePayment = () => {
    setIsProcessing(true);
    
    // Armazenar a referência do toast para poder removê-lo depois
    const { dismiss } = toast({
      title: "Processando pagamento...",
      description: "Por favor, aguarde...",
      variant: "default",
    });
    
    // Simulate payment success after 1.5 seconds
    setTimeout(() => {
      // Primeiro, remover o toast de processamento
      dismiss();
      
      // Aguardar um pequeno intervalo para evitar sobreposição
      setTimeout(() => {
        setIsProcessing(false);
        toast({
          title: "Pagamento aprovado!",
          description: "Agora você pode tentar me convencer!",
          variant: "default",
        });
        onPaymentSuccess();
      }, 100);
    }, 1500);
  };
  
  return (
    <div className="bg-theme-dark-purple border border-theme-purple rounded-md p-3 text-center w-full shadow-md">
      <div className="flex flex-col md:flex-row md:items-center">
        <div className="flex-1 text-left mb-2 md:mb-0 md:mr-4">
          <h3 className="text-lg font-bold text-theme-light-purple">
            540 pessoas fracassaram
          </h3>
          <p className="text-sm text-theme-soft-purple">
            Quer tentar algo melhor que elas?
          </p>
        </div>
        <div className="flex-none">
          <Button
            onClick={handlePayment}
            disabled={isProcessing}
            className="bg-theme-vivid-purple hover:bg-theme-purple text-white font-semibold px-4 py-2 rounded-md w-full md:min-w-[140px] flex items-center justify-center"
          >
            {isProcessing ? "Processando..." : "1$ Convencer"}
          </Button>
          <p className="text-xs text-theme-soft-purple mt-1 opacity-75">
            Desbloquear uma chance
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentPrompt;
