import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';
import { Loader2 } from 'lucide-react';

// Verificar se a chave pública do Stripe está definida
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  console.warn('VITE_STRIPE_PUBLIC_KEY não encontrada. O checkout do Stripe não funcionará corretamente.');
}

// Carregar o Stripe.js uma vez na aplicação
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY as string);

interface StripeCheckoutProps {
  amount: number;
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

const StripeCheckout: React.FC<StripeCheckoutProps> = ({ amount, onPaymentSuccess, onCancel }) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Criar PaymentIntent assim que o componente for montado
    const createPaymentIntent = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ amount }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Erro ao criar intenção de pagamento');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err: any) {
        console.error('Erro ao criar payment intent:', err);
        setError(err.message || 'Não foi possível conectar ao serviço de pagamento');
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [amount]);

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#6366f1',
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-center text-muted-foreground">
          Preparando o checkout...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="text-red-500 mb-4 text-center">
          <p className="font-semibold">Erro ao conectar ao serviço de pagamento</p>
          <p className="text-sm">{error}</p>
        </div>
        <button 
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          onClick={onCancel}
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-4">
      {clientSecret && (
        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm 
            onPaymentSuccess={onPaymentSuccess}
            onCancel={onCancel}
          />
        </Elements>
      )}
    </div>
  );
};

export default StripeCheckout;