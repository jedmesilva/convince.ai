
import React, { useState } from 'react';
import { DollarSign } from 'lucide-react';
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
    <div className="w-full">
      <Button
        onClick={handlePayment}
        disabled={isProcessing}
        className="bg-theme-vivid-purple hover:bg-theme-purple text-white font-semibold py-3 rounded-lg w-full flex items-center justify-center"
      >
        <DollarSign className="h-5 w-5 mr-1" />
        {isProcessing ? "Processando pagamento..." : "1$ para convencer"}
      </Button>
    </div>
  );
};

export default PaymentPrompt;
