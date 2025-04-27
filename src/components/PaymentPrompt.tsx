
import React, { useState } from 'react';
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";
import PaymentDialog from './PaymentDialog';

interface PaymentPromptProps {
  onPaymentSuccess: () => void;
}

const PaymentPrompt: React.FC<PaymentPromptProps> = ({ onPaymentSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handlePaymentSuccess = () => {
    setIsProcessing(true);
    setIsDialogOpen(false);
    
    const { dismiss } = toast({
      title: "Processando pagamento...",
      description: "Por favor, aguarde...",
      variant: "default",
    });
    
    setTimeout(() => {
      dismiss();
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
        onClick={() => setIsDialogOpen(true)}
        disabled={isProcessing}
        className="bg-theme-vivid-purple hover:bg-theme-purple text-white font-semibold py-3 rounded-lg w-full flex items-center justify-center"
      >
        {isProcessing ? "Processando pagamento..." : "1$ para convencer a IA"}
      </Button>

      <PaymentDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default PaymentPrompt;
