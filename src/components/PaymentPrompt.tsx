
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface PaymentPromptProps {
  onPaymentSuccess: () => void;
}

const PaymentPrompt: React.FC<PaymentPromptProps> = ({ onPaymentSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handlePayment = () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    toast({
      title: "Processando pagamento...",
      description: "Por favor, aguarde...",
      variant: "default", // Use default variant instead of non-existent "success"
    });
    
    // Simulate payment success after 1.5 seconds
    setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: "Pagamento aprovado!",
        description: "Agora você pode tentar me convencer!",
        variant: "default", // Use default variant
      });
      onPaymentSuccess();
    }, 1500);
  };
  
  return (
    <div className="bg-theme-dark-purple border-2 border-theme-purple rounded-lg p-6 text-center max-w-md w-full shadow-xl my-2">
      <h3 className="text-2xl font-bold text-theme-light-purple mb-2">
        540 pessoas fracassaram com argumentos chulos
      </h3>
      <p className="text-theme-soft-purple mb-6">
        Quer tentar algo melhor que elas?
      </p>
      
      <Button
        onClick={handlePayment}
        disabled={isProcessing}
        className="bg-theme-vivid-purple hover:bg-theme-purple text-white font-bold px-8 py-6 rounded-lg text-lg w-full flex items-center justify-center"
      >
        {isProcessing ? "Processando..." : "1$ Convencer"}
      </Button>
      
      <p className="text-sm text-theme-soft-purple mt-4 opacity-75">
        Pague 1$ para desbloquear uma chance de ganhar!
      </p>
    </div>
  );
};

export default PaymentPrompt;
