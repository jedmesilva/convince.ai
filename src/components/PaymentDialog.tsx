
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
import { processPaymentAndRegister, processPaymentForExistingUser } from '@/lib/supabase-auth';

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  sessionId: string; // ID da sessão atual para associar ao pagamento
}

// Estados possíveis do checkout
type CheckoutStep = "payment" | "account" | "processing";

const PaymentDialog: React.FC<PaymentDialogProps> = ({ isOpen, onClose, onPaymentSuccess, sessionId }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"checkout" | "login">("checkout");
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("payment");
  
  // Estado para os dados de pagamento
  const [paymentMethod, setPaymentMethod] = useState<"credit" | "pix">("credit");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  
  // Estado para os dados de registro
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Estado para os dados de login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Estado de loading
  const [isLoading, setIsLoading] = useState(false);

  // Efeito para monitorar mudanças no estado checkoutStep
  useEffect(() => {
    console.log("checkoutStep mudou para:", checkoutStep);
  }, [checkoutStep]);

  // Validação básica de formulário
  const isPaymentFormValid = () => {
    if (paymentMethod === "credit") {
      return cardNumber.length > 0 && expiry.length > 0 && cvv.length > 0;
    }
    return true; // Para PIX consideramos válido sem campos adicionais
  };
  
  const isAccountFormValid = () => {
    return name.length > 0 && email.includes('@') && password.length >= 6;
  };
  
  const isLoginFormValid = () => {
    return loginEmail.includes('@') && loginPassword.length > 0;
  };

  // Manipuladores de eventos
  const handlePaymentSubmit = () => {
    console.log("Chamando handlePaymentSubmit, validação:", isPaymentFormValid());
    
    if (!isPaymentFormValid()) {
      toast({
        title: "Informações incompletas",
        description: "Por favor, preencha todos os campos de pagamento",
        variant: "destructive"
      });
      return;
    }
    
    console.log("Mudando passo para account");
    // Usando setTimeout para garantir que a mudança de estado seja processada corretamente
    setTimeout(() => {
      setCheckoutStep("account");
      console.log("Checkout step alterado para account");
    }, 50);
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
      // Processar pagamento e registro
      await processPaymentAndRegister(
        {
          amount: 1, // Valor fixo de $1
          sessionId,
          method: paymentMethod,
          status: "completed"
        },
        {
          name,
          email,
          password
        }
      );
      
      toast({
        title: "Pagamento realizado!",
        description: "Sua conta foi criada e o pagamento foi processado com sucesso.",
      });
      
      setIsLoading(false);
      onPaymentSuccess();
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      toast({
        title: "Erro no processamento",
        description: "Ocorreu um erro ao processar seu pagamento. Tente novamente.",
        variant: "destructive"
      });
      setIsLoading(false);
      setCheckoutStep("payment");
    }
  };
  
  const handleLoginSubmit = async () => {
    if (!isLoginFormValid()) {
      toast({
        title: "Informações de login incompletas",
        description: "Por favor, forneça um email válido e senha",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Processar pagamento para usuário existente
      await processPaymentForExistingUser(
        {
          amount: 1, // Valor fixo de $1
          sessionId,
          method: "login_payment",
          status: "completed"
        },
        {
          email: loginEmail,
          password: loginPassword
        }
      );
      
      toast({
        title: "Pagamento realizado!",
        description: "Login efetuado e pagamento processado com sucesso.",
      });
      
      setIsLoading(false);
      onPaymentSuccess();
    } catch (error) {
      console.error("Erro ao fazer login e processar pagamento:", error);
      toast({
        title: "Erro no processamento",
        description: "Falha ao fazer login ou processar pagamento. Verifique suas credenciais.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // Resetar o estado quando o modal é fechado
  const handleClose = () => {
    if (!isLoading) {
      setCheckoutStep("payment");
      onClose();
    }
  };

  // Para depuração - mostra o estado atual do checkoutStep no topo
  const renderDebugInfo = () => (
    <div className="bg-gray-100 p-2 mb-2 text-xs">
      <p>Debug: checkoutStep = {checkoutStep}</p>
      <p>isPaymentFormValid: {isPaymentFormValid() ? "true" : "false"}</p>
      <p>activeTab: {activeTab}</p>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-theme-vivid-purple">Pagamento</DialogTitle>
        </DialogHeader>
        
        {renderDebugInfo()}
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "checkout" | "login")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="checkout" disabled={isLoading}>Checkout</TabsTrigger>
            <TabsTrigger value="login" disabled={isLoading}>Login</TabsTrigger>
          </TabsList>
          
          <TabsContent value="checkout">
            {checkoutStep === "payment" && (
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
                    Continuar
                  </Button>
                </CardFooter>
              </Card>
            )}
            
            {checkoutStep === "account" && (
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
            )}
            
            {checkoutStep === "processing" && (
              <Card>
                <CardHeader>
                  <CardTitle>Processando</CardTitle>
                  <CardDescription>Por favor, aguarde enquanto processamos seu pagamento</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-theme-vivid-purple" />
                </CardContent>
              </Card>
            )}
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
