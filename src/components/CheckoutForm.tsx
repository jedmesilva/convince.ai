import React, { useState, useEffect } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface CheckoutFormProps {
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ onPaymentSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    // Recuperar o status do pagamento da URL
    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    );

    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      if (!paymentIntent) {
        setMessage('Não foi possível recuperar o status do pagamento');
        return;
      }

      switch (paymentIntent.status) {
        case 'succeeded':
          setMessage('Pagamento bem-sucedido!');
          onPaymentSuccess();
          break;
        case 'processing':
          setMessage('Seu pagamento está sendo processado.');
          break;
        case 'requires_payment_method':
          setMessage('Seu pagamento não foi realizado, por favor tente novamente.');
          break;
        default:
          setMessage('Algo deu errado com seu pagamento.');
          break;
      }
    });
  }, [stripe, onPaymentSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js não carregou ainda
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Redirecionar para a URL de sucesso após o pagamento
        return_url: `${window.location.origin}/success`,
      },
    });

    if (error.type === "card_error" || error.type === "validation_error") {
      setMessage(error.message || "Ocorreu um erro no pagamento.");
      toast({
        title: "Erro no pagamento",
        description: error.message || "Ocorreu um erro no pagamento.",
        variant: "destructive",
      });
    } else {
      setMessage("Ocorreu um erro inesperado no processamento do pagamento.");
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado no processamento do pagamento.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Pagamento</CardTitle>
        <CardDescription>Complete seu pagamento para continuar</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <PaymentElement />
          {message && <div className="mt-4 text-sm text-red-500">{message}</div>}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
            type="button"
          >
            Cancelar
          </Button>
          <Button 
            disabled={isLoading || !stripe || !elements} 
            type="submit"
          >
            {isLoading ? "Processando..." : "Pagar agora"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default CheckoutForm;