import React, { useState } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentConfirm: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onPaymentConfirm }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const handleConfirmPayment = () => {
    onPaymentConfirm();
    onClose();
    // Reset form fields
    setCardNumber('');
    setExpiry('');
    setCvv('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
        <DialogHeader className="flex justify-between items-center">
          <DialogTitle className="font-semibold text-xl text-white">Pagamento Rápido</DialogTitle>
          <DialogClose className="text-gray-400 hover:text-white">
            <X className="h-6 w-6" />
          </DialogClose>
        </DialogHeader>
        
        <div className="mb-4">
          <p className="text-sm text-gray-300 mb-4">Pague $1 para desbloquear uma chance de ganhar!</p>
          
          <div className="space-y-4">
            <div>
              <Label className="block text-sm text-gray-400 mb-1">Número do Cartão</Label>
              <Input
                type="text"
                placeholder="1234 5678 9012 3456"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
              />
            </div>
            
            <div className="flex space-x-4">
              <div className="flex-1">
                <Label className="block text-sm text-gray-400 mb-1">Validade</Label>
                <Input
                  type="text"
                  placeholder="MM/AA"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label className="block text-sm text-gray-400 mb-1">CVV</Label>
                <Input
                  type="text"
                  placeholder="123"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        
        <Button
          onClick={handleConfirmPayment} 
          className="w-full bg-primary hover:bg-secondary text-white font-medium py-3 px-4 rounded-lg transition-all duration-300"
        >
          Pagar $1 e Tentar
        </Button>
        
        <p className="text-xs text-gray-500 text-center mt-4">Esta é apenas uma demonstração. Nenhum pagamento real será processado.</p>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
