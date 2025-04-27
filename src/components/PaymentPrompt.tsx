
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
    <div className="w-full px-4 py-3">
      <Button
        onClick={handlePayment}
        disabled={isProcessing}
        className="bg-theme-vivid-purple hover:bg-theme-purple text-white font-semibold py-3 rounded-lg w-full flex items-center justify-center"
      >
        {isProcessing ? "Processando pagamento..." : "1$ para convencer"}
      </Button>
    </div>
  );
};

export default PaymentPrompt;
