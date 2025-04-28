
import React, { useState, useEffect } from 'react';
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";
import PaymentDialog from './PaymentDialog';
import { v4 as uuidv4 } from 'uuid';

interface PaymentPromptProps {
  onPaymentSuccess: () => void;
}

const PaymentPrompt: React.FC<PaymentPromptProps> = ({ onPaymentSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const { toast } = useToast();

  // Inicializar ou recuperar o ID de sessão para o usuário atual
  useEffect(() => {
    // Tenta obter o ID de sessão do armazenamento local
    let existingSessionId = localStorage.getItem('session_id');
    
    // Se não existir, cria um novo
    if (!existingSessionId) {
      existingSessionId = uuidv4();
      localStorage.setItem('session_id', existingSessionId);
    }
    
    setSessionId(existingSessionId);
  }, []);

  const handlePaymentSuccess = () => {
    setIsProcessing(true);
    setIsDialogOpen(false);
    
    const { dismiss } = toast({
      title: "Processando pagamento...",
      description: "Por favor, aguarde...",
      variant: "default",
    });
    
    // Reduzimos o timeout já que o processamento real agora acontece no diálogo
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
    }, 500);
  };
  
  return (
    <div className="w-full px-4 py-3">
      <Button
        onClick={() => setIsDialogOpen(true)}
        disabled={isProcessing}
        className={`bg-theme-vivid-purple hover:bg-theme-purple text-white font-semibold py-3 rounded-lg w-full flex items-center justify-center
          ${!isProcessing ? 'animate-payment-button-pulse' : ''}`}
      >
        {isProcessing ? "Processando pagamento..." : "1$ para convencer a IA"}
      </Button>

      <PaymentDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
        sessionId={sessionId}
      />
    </div>
  );
};

export default PaymentPrompt;
