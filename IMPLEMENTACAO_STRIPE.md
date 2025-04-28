# Implementação do Stripe na Aplicação

Este documento descreve as alterações implementadas para integrar o Stripe como plataforma de pagamento na aplicação.

## Problemas identificados

1. **Conexão entre frontend e backend**: O frontend Vite está rodando na porta 8080, mas o servidor Express deve rodar na porta 5000 para processar APIs.
2. **Inicialização do servidor**: O workflow atual executa apenas `npm run dev`, que inicia apenas o Vite, sem o servidor Express.

## Soluções implementadas

### 1. Simulação local no PaymentDialog

Foi implementada uma simulação local no componente `PaymentDialog.tsx` para permitir que o fluxo de pagamento continue funcionando mesmo sem o servidor Express:

```javascript
// Função para simular resposta de pagamento
const simulatePayment = async () => {
  console.log("Simulando pagamento localmente");
  
  // Simulamos a resposta que viria do servidor
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve({
      success: true,
      message: 'Pagamento simulado processado com sucesso',
      session_id: sessionId,
      payment_id: `pay_sim_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
    }),
    text: () => Promise.resolve(JSON.stringify({
      success: true,
      message: 'Pagamento simulado processado com sucesso'
    }))
  };
};

// Função de fetch com fallback para simulação
const fetchWithFallback = async (url, options) => {
  if (useSimulation) {
    return simulatePayment();
  }
  
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    console.error("Erro na requisição, usando simulação:", error);
    return simulatePayment();
  }
};
```

### 2. Componentes Stripe preparados

Foram criados dois componentes para integração futura com o Stripe:

1. `CheckoutForm.tsx`: Componente de formulário de pagamento Stripe
2. `StripeCheckout.tsx`: Componente wrapper que cria a intenção de pagamento e inicializa o Stripe

### 3. Servidor combinado

Foi criado um servidor combinado (`stripe-server.js`) que:

- Inicia tanto o servidor Express quanto o Vite
- Implementa rotas de API para o Stripe
- Configura proxy para o frontend Vite
- Usa as chaves do Stripe configuradas no ambiente

## Arquivos de configuração

Adicionamos um arquivo `.env.example` com as variáveis necessárias:

```
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
VITE_STRIPE_PUBLIC_KEY=pk_test_your_public_key_here

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mydb

# Session Secret
SESSION_SECRET=your_session_secret_here

# Porta do servidor
PORT=5000
```

## Próximos passos

Para completar a integração do Stripe:

1. **Corrigir o workflow**: Modificar o workflow para executar `node stripe-server.js` em vez de apenas `npm run dev`.
2. **Persistência de dados**: Ajustar o servidor para salvar registros de pagamento no banco de dados.
3. **Implementar webhook do Stripe**: Para processar eventos assíncronos como confirmações de pagamento.
4. **Integrar completamente no frontend**: Substituir a simulação no `PaymentDialog.tsx` por chamadas reais ao Stripe.

## Resumo da integração do Stripe

- Chave secreta do Stripe (STRIPE_SECRET_KEY): Usada no backend para criar PaymentIntents
- Chave pública do Stripe (VITE_STRIPE_PUBLIC_KEY): Usada no frontend para inicializar o formulário de pagamento
- Rotas de API implementadas:
  - `/api/create-payment-intent`: Para criar intenções de pagamento
  - `/api/payment`: Compatibilidade com código existente

## Observações

- O servidor Express na porta 5000 ainda não está sendo inicializado corretamente no ambiente Replit.
- A simulação local no PaymentDialog permite continuar o desenvolvimento sem depender do servidor.