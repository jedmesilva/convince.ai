
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({ isOpen, onClose, onPaymentSuccess }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-theme-vivid-purple">Pagamento</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="checkout" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="checkout">Checkout</TabsTrigger>
            <TabsTrigger value="login">Login</TabsTrigger>
          </TabsList>
          
          <TabsContent value="checkout">
            <Card>
              <CardHeader>
                <CardTitle>Método de Pagamento</CardTitle>
                <CardDescription>Escolha como deseja pagar $1</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup defaultValue="credit" className="space-y-4">
                  <div className="flex items-center space-x-4 rounded-lg border p-4">
                    <RadioGroupItem value="credit" id="credit" />
                    <Label htmlFor="credit">Cartão de Crédito</Label>
                  </div>
                  <div className="flex items-center space-x-4 rounded-lg border p-4">
                    <RadioGroupItem value="pix" id="pix" />
                    <Label htmlFor="pix">PIX</Label>
                  </div>
                </RadioGroup>
                
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Número do Cartão</Label>
                    <Input placeholder="1234 5678 9012 3456" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Validade</Label>
                      <Input placeholder="MM/AA" />
                    </div>
                    <div className="space-y-2">
                      <Label>CVV</Label>
                      <Input placeholder="123" />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={onPaymentSuccess} 
                  className="w-full bg-theme-vivid-purple hover:bg-theme-purple"
                >
                  Pagar $1
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>Entre com sua conta existente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input placeholder="seu@email.com" type="email" />
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input placeholder="••••••••" type="password" />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Entrar</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
