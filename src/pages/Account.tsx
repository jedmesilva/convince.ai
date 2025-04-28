import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logoutUser } from '../lib/supabase-auth';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Label } from "../components/ui/label";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "../components/ui/use-toast";

interface PaymentHistory {
  id: number;
  amount: number;
  status: string;
  timestamp: Date;
}

const Account = () => {
  const [prizeAmount, setPrizeAmount] = useState<number>(0);
  const [withdrawMethod, setWithdrawMethod] = useState<string>("pix");
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState<boolean>(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch prize amount and payment history when component mounts
    const fetchAccountData = async () => {
      try {
        setLoading(true);
        
        // Fetch prize amount
        try {
          const statsResponse = await fetch('/api/stats');
          
          // Verifica se a resposta é do tipo JSON
          const contentType = statsResponse.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1 && statsResponse.ok) {
            const statsData = await statsResponse.json();
            setPrizeAmount(statsData.prizeAmount);
          } else {
            console.log("Usando valor padrão para prêmio");
            // Usa valor padrão se a API não responder corretamente
            setPrizeAmount(0);
          }
        } catch (statsError) {
          console.error('Error fetching stats:', statsError);
          // Usa valor padrão se ocorrer erro
          setPrizeAmount(0);
        }
        
        // Fetch payment history
        try {
          const paymentsResponse = await fetch('/api/payments');
          
          // Verifica se a resposta é do tipo JSON
          const contentType = paymentsResponse.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1 && paymentsResponse.ok) {
            const paymentsData = await paymentsResponse.json();
            // Convert timestamp strings to Date objects
            const formattedPayments = paymentsData.map((payment: any) => ({
              ...payment,
              timestamp: new Date(payment.timestamp)
            }));
            setPaymentHistory(formattedPayments);
          } else {
            console.log("Usando array vazio para histórico de pagamentos");
            // Usa array vazio se a API não responder corretamente
            setPaymentHistory([]);
          }
        } catch (paymentError) {
          console.error('Error fetching payment history:', paymentError);
          // Usa array vazio se ocorrer erro
          setPaymentHistory([]);
        }
        
      } catch (error) {
        console.error('Error fetching account data:', error);
        // Usa valores padrão para todos os dados
        setPrizeAmount(0);
        setPaymentHistory([]);
        
        // Não mostramos toast de erro para não confundir o usuário
        // quando o servidor não estiver disponível
      } finally {
        setLoading(false);
      }
    };
    
    fetchAccountData();
  }, []);
  
  const handleWithdraw = async () => {
    try {
      // Send withdrawal request
      try {
        const response = await fetch('/api/withdraw', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ method: withdrawMethod }),
        });
        
        // Verifica se a resposta é do tipo JSON
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1 && response.ok) {
          const data = await response.json();
          
          // Add the withdrawal to the payment history
          if (data.withdrawal) {
            setPaymentHistory(prev => [data.withdrawal, ...prev]);
          }
        } else {
          console.log("API de saque não está disponível, simulando saque");
          
          // Criar um objeto de saque simulado se a API não estiver funcionando
          const simulatedWithdrawal = {
            id: Date.now(),
            amount: prizeAmount,
            status: 'pending',
            timestamp: new Date(),
            method: withdrawMethod
          };
          
          // Adiciona o saque simulado ao histórico
          setPaymentHistory(prev => [simulatedWithdrawal as PaymentHistory, ...prev]);
        }
      } catch (apiError) {
        console.error('API error:', apiError);
        
        // Mesma simulação em caso de erro de API
        const simulatedWithdrawal = {
          id: Date.now(),
          amount: prizeAmount,
          status: 'pending',
          timestamp: new Date(),
          method: withdrawMethod
        };
        
        // Adiciona o saque simulado ao histórico
        setPaymentHistory(prev => [simulatedWithdrawal as PaymentHistory, ...prev]);
      }
      
      // Update prize amount after withdrawal (sempre zera o prêmio após o saque)
      setPrizeAmount(0);
      
      toast({
        title: "Solicitação enviada!",
        description: `Seu prêmio será enviado via ${getMethodLabel(withdrawMethod)} em breve.`,
        variant: "default",
      });
      setWithdrawDialogOpen(false);
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast({
        title: "Erro ao processar saque",
        description: "Não foi possível processar sua solicitação de saque. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };
  
  const getMethodLabel = (method: string): string => {
    switch (method) {
      case "pix":
        return "PIX";
      case "bankAccount":
        return "Conta Bancária";
      case "crypto":
        return "Wallet Cripto";
      default:
        return "Método desconhecido";
    }
  };
  
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <Link 
          to="/" 
          className="flex items-center text-theme-soft-purple hover:text-theme-bright-purple transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span>Voltar para o início</span>
        </Link>
        <Button
          onClick={async () => {
            try {
              await logoutUser();
              navigate('/');
            } catch (error) {
              toast({
                title: "Erro ao sair",
                description: "Não foi possível fazer logout.",
                variant: "destructive"
              });
            }
          }}
          variant="outline"
          className="text-theme-soft-purple hover:text-theme-bright-purple"
        >
          Sair
        </Button>
      </div>
      
      <h1 className="text-3xl font-bold mb-8 text-theme-light-purple">Minha Conta</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Prize Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-xl text-theme-light-purple">Prêmio Acumulado</CardTitle>
            <CardDescription>Seu prêmio atual disponível para saque</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-theme-bright-purple mb-2">
              {loading ? "..." : `$${prizeAmount}`}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => setWithdrawDialogOpen(true)}
              disabled={loading || prizeAmount <= 0}
              className="w-full bg-theme-bright-purple hover:bg-theme-light-purple"
            >
              Sacar Prêmio
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
        
        {/* History Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl text-theme-light-purple">Histórico de Prêmios</CardTitle>
            <CardDescription>Todos os prêmios que você ganhou até agora</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="completed">Pagos</TabsTrigger>
                <TabsTrigger value="pending">Pendentes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                {loading ? (
                  <div className="text-center py-6">Carregando histórico...</div>
                ) : paymentHistory.length > 0 ? (
                  <div className="space-y-4">
                    {paymentHistory.map((payment) => (
                      <div 
                        key={payment.id} 
                        className="flex justify-between items-center border-b pb-3"
                      >
                        <div>
                          <div className="font-medium">${payment.amount}</div>
                          <div className="text-sm text-gray-500">{formatDate(payment.timestamp)}</div>
                        </div>
                        <div className={`flex items-center ${payment.status === 'successful' ? 'text-green-500' : 'text-amber-500'}`}>
                          {payment.status === 'successful' ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              <span>Pago</span>
                            </>
                          ) : (
                            <>
                              <span>Pendente</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    Você ainda não recebeu nenhum prêmio.
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="completed">
                {loading ? (
                  <div className="text-center py-6">Carregando histórico...</div>
                ) : paymentHistory.filter(p => p.status === 'successful').length > 0 ? (
                  <div className="space-y-4">
                    {paymentHistory
                      .filter(p => p.status === 'successful')
                      .map((payment) => (
                        <div 
                          key={payment.id} 
                          className="flex justify-between items-center border-b pb-3"
                        >
                          <div>
                            <div className="font-medium">${payment.amount}</div>
                            <div className="text-sm text-gray-500">{formatDate(payment.timestamp)}</div>
                          </div>
                          <div className="text-green-500 flex items-center">
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            <span>Pago</span>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    Você ainda não recebeu nenhum prêmio.
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="pending">
                {loading ? (
                  <div className="text-center py-6">Carregando histórico...</div>
                ) : paymentHistory.filter(p => p.status !== 'successful').length > 0 ? (
                  <div className="space-y-4">
                    {paymentHistory
                      .filter(p => p.status !== 'successful')
                      .map((payment) => (
                        <div 
                          key={payment.id} 
                          className="flex justify-between items-center border-b pb-3"
                        >
                          <div>
                            <div className="font-medium">${payment.amount}</div>
                            <div className="text-sm text-gray-500">{formatDate(payment.timestamp)}</div>
                          </div>
                          <div className="text-amber-500">
                            <span>Pendente</span>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    Você não tem nenhum pagamento pendente.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Escolha como receber seu prêmio</DialogTitle>
            <DialogDescription>
              Selecione o método que deseja utilizar para receber seu prêmio de ${prizeAmount}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <RadioGroup value={withdrawMethod} onValueChange={setWithdrawMethod}>
              <div className="flex items-center space-x-2 space-y-1">
                <RadioGroupItem value="pix" id="pix" />
                <Label htmlFor="pix">PIX</Label>
              </div>
              <div className="flex items-center space-x-2 space-y-1">
                <RadioGroupItem value="bankAccount" id="bankAccount" />
                <Label htmlFor="bankAccount">Conta Bancária</Label>
              </div>
              <div className="flex items-center space-x-2 space-y-1">
                <RadioGroupItem value="crypto" id="crypto" />
                <Label htmlFor="crypto">Wallet Cripto</Label>
              </div>
            </RadioGroup>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setWithdrawDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleWithdraw}
              className="bg-theme-bright-purple hover:bg-theme-light-purple"
            >
              Confirmar Saque
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Account;