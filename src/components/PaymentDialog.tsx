
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { processPaymentAndRegister, processPaymentForExistingUser, UserRegistrationData, UserLoginData, PaymentData } from '@/lib/supabase-auth';

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  sessionId: string;
}

type CheckoutStep = "payment" | "account" | "processing";

const PaymentDialog: React.FC<PaymentDialogProps> = ({ isOpen, onClose, onPaymentSuccess, sessionId }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"checkout" | "login">("checkout");
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("payment");
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<"credit" | "pix">("credit");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  
  // Account state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);

  const isPaymentFormValid = () => {
    if (paymentMethod === "credit") {
      return cardNumber.length > 0 && expiry.length > 0 && cvv.length > 0;
    }
    return true;
  };
  
  const isAccountFormValid = () => {
    return name.length > 0 && email.includes('@') && password.length >= 6;
  };
  
  const isLoginFormValid = () => {
    return loginEmail.includes('@') && loginPassword.length > 0;
  };

  const handlePaymentSubmit = () => {
    if (!isPaymentFormValid()) {
      toast({
        title: "Informações incompletas",
        description: "Por favor, preencha todos os campos de pagamento",
        variant: "destructive"
      });
      return;
    }
    setCheckoutStep("account");
  };
  
  const handleAccountSubmit = async () => {
    if (!isAccountFormValid()) {
      toast({
        title: "Informações de conta incompletas",
        description: "Por favor, preencha nome, email válido e senha (mínimo 6 caracteres)",
        variant: "destructive"
      });
      return;
    }
    
    setCheckoutStep("processing");
    setIsLoading(true);
    
    try {
      const paymentData: PaymentData = {
        amount: 1,
        sessionId,
        method: paymentMethod,
        status: "completed"
      };

      const userData: UserRegistrationData = {
        name,
        email,
        password
      };

      const result = await processPaymentAndRegister(paymentData, userData);
      
      toast({
        title: "Sucesso!",
        description: "Sua conta foi criada e o pagamento foi processado.",
      });
      
      setIsLoading(false);
      onPaymentSuccess();
    } catch (error) {
      console.error("Erro ao processar:", error);
      toast({
        title: "Erro no processamento",
        description: "Ocorreu um erro. Tente novamente.",
        variant: "destructive"
      });
      setIsLoading(false);
      setCheckoutStep("payment");
    }
  };
  
  const handleLoginSubmit = async () => {
    if (!isLoginFormValid()) {
      toast({
        title: "Informações incompletas",
        description: "Por favor, forneça um email válido e senha",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const paymentData: PaymentData = {
        amount: 1,
        sessionId,
        method: "login_payment",
        status: "completed"
      };

      const loginData: UserLoginData = {
        email: loginEmail,
        password: loginPassword
      };

      await processPaymentForExistingUser(paymentData, loginData);
      
      toast({
        title: "Sucesso!",
        description: "Login efetuado e pagamento processado.",
      });
      
      setIsLoading(false);
      onPaymentSuccess();
    } catch (error) {
      console.error("Erro ao processar:", error);
      toast({
        title: "Erro no processamento",
        description: "Falha ao fazer login ou processar pagamento.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setCheckoutStep("payment");
      onClose();
    }
  };

  const renderPaymentSection = () => (
    <Card>
      <CardHeader>
        <CardTitle>Método de Pagamento</CardTitle>
        <CardDescription>Escolha como deseja pagar $1</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup 
          value={paymentMethod} 
          onValueChange={(value) => setPaymentMethod(value as "credit" | "pix")}
          className="space-y-4"
        >
          <div className="flex items-center space-x-4 rounded-lg border p-4">
            <RadioGroupItem value="credit" id="credit" />
            <Label htmlFor="credit">Cartão de Crédito</Label>
          </div>
          <div className="flex items-center space-x-4 rounded-lg border p-4">
            <RadioGroupItem value="pix" id="pix" />
            <Label htmlFor="pix">PIX</Label>
          </div>
        </RadioGroup>
        
        {paymentMethod === "credit" && (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Número do Cartão</Label>
              <Input 
                placeholder="1234 5678 9012 3456" 
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Validade</Label>
                <Input 
                  placeholder="MM/AA" 
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>CVV</Label>
                <Input 
                  placeholder="123" 
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handlePaymentSubmit} 
          className="w-full bg-theme-vivid-purple hover:bg-theme-purple"
        >
          Continuar para Criação de Conta
        </Button>
      </CardFooter>
    </Card>
  );

  const renderAccountSection = () => (
    <Card>
      <CardHeader>
        <CardTitle>Crie sua conta</CardTitle>
        <CardDescription>Crie uma conta para concluir o pagamento</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Nome</Label>
          <Input 
            placeholder="Seu nome" 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input 
            placeholder="seu@email.com" 
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Senha</Label>
          <Input 
            placeholder="••••••••" 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => setCheckoutStep("payment")}
        >
          Voltar
        </Button>
        <Button 
          onClick={handleAccountSubmit}
          className="bg-theme-vivid-purple hover:bg-theme-purple"
        >
          Finalizar Pagamento
        </Button>
      </CardFooter>
    </Card>
  );

  const renderProcessingSection = () => (
    <Card>
      <CardHeader>
        <CardTitle>Processando</CardTitle>
        <CardDescription>Por favor, aguarde enquanto processamos seu pagamento</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-theme-vivid-purple" />
      </CardContent>
    </Card>
  );

  const renderLoginSection = () => (
    <Card>
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Entre com sua conta existente</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input 
            placeholder="seu@email.com" 
            type="email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label>Senha</Label>
          <Input 
            placeholder="••••••••" 
            type="password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full bg-theme-vivid-purple hover:bg-theme-purple"
          onClick={handleLoginSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando
            </>
          ) : (
            "Entrar e Pagar"
          )}
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-theme-vivid-purple">Pagamento</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "checkout" | "login")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="checkout" disabled={isLoading}>Checkout</TabsTrigger>
            <TabsTrigger value="login" disabled={isLoading}>Login</TabsTrigger>
          </TabsList>
          
          <TabsContent value="checkout">
            {checkoutStep === "payment" && renderPaymentSection()}
            {checkoutStep === "account" && renderAccountSection()}
            {checkoutStep === "processing" && renderProcessingSection()}
          </TabsContent>
          
          <TabsContent value="login">
            {renderLoginSection()}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
