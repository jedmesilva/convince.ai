DOC FLUXOGRAMA CHATCONVINCEAI:

# Fluxo da Aplicação ChatConvinceAI

## 1. Inicialização da Aplicação

Quando a aplicação é carregada, verifica-se automaticamente se o usuário está autenticado.

## 2. Verificação de Autenticação

### 2.1 Usuário Autenticado
- **Ação**: Verifica saldo de tempo do usuário
- **Se tem saldo**: Exibe botão "Iniciar tentativa"
- **Se não tem saldo**: Exibe botão "Adicionar tempo para tentar"

### 2.2 Usuário Não Autenticado
- **Ação**: Exibe botão "Desbloquear chat" para autenticação

## 3. Processo de Autenticação (Usuário Não Autenticado)

### 3.1 Início do Processo
- Usuário clica em "Desbloquear chat"
- Sistema abre checkout solicitando email

### 3.2 Verificação de Conta
- Sistema verifica se usuário já existe no sistema

#### 3.2.1 Usuário Já Tem Conta
- Exibe formulário de login (solicita senha)
- Realiza autenticação

#### 3.2.2 Usuário Não Tem Conta
- Exibe formulário de cadastro (solicita nome e senha)
- Realiza cadastro do usuário

### 3.3 Pós-Autenticação
- Verifica saldo de tempo do usuário autenticado
- Direciona para etapa de compra de tempo

## 4. Processo de Compra de Tempo

### 4.1 Exibição do Checkout
- Mostra opções de compra de tempo
- Opções: "Comprar agora" ou "Comprar depois"

### 4.2 Opção "Comprar Depois"
- Fecha o checkout
- Retorna ao estado inicial

### 4.3 Opção "Comprar Agora"
- **Pagamento via PIX**:
  - Exibe botão para gerar código PIX
  - Gera QR Code e código para cópia
  - Status inicial: "Aguardando pagamento"
  - Após confirmação: "Pagamento confirmado"
  - Exibe botão "Iniciar tentativa"

- **Pagamento via Cartão**:
  - Exibe formulário de cartão
  - Tela de confirmação com status "Aguardando pagamento"
  - Após confirmação: "Pagamento confirmado"
  - Exibe botão "Iniciar tentativa"

## 5. Gerenciamento de Tentativas

### 5.1 Iniciar Tentativa
- Usuário clica em "Iniciar tentativa"
- Sistema cria tentativa no banco de dados
- Carrega informações da tentativa no cache do chat
- Verifica status da tentativa

### 5.2 Estados da Tentativa
- **Active**: Chat desbloqueado, usuário pode enviar mensagens
- **Abandoned**: Chat bloqueado
- **Expired**: Chat bloqueado

### 5.3 Controle da Tentativa Ativa
- **Timer ativo**: Monitora saldo de tempo restante
- **Botão "Parar tentativa"**: Permite interromper manualmente
  - Muda status para "abandoned"
  - Bloqueia o chat

## 6. Sistema de Timer

### 6.1 Funcionamento
- Atualiza timer com saldo de tempo do usuário
- Monitora tempo restante continuamente

### 6.2 Timer Zerado (Trigger)
- Quando timer = 0 (saldo esgotado)
- Muda status da tentativa para "expired"
- Bloqueia o chat
- Verifica se usuário ainda possui saldo de tempo adicional

## 7. Estados do Chat

### 7.1 Chat Desbloqueado
- Tentativa com status "active"
- Usuário pode enviar mensagens
- Timer em funcionamento

### 7.2 Chat Bloqueado
- Tentativa com status "abandoned" ou "expired"
- Usuário não pode enviar mensagens
- Opções: adicionar mais tempo ou iniciar nova tentativa

## 8. Fluxo de Verificações Contínuas

O sistema realiza verificações constantes de:
- Status de autenticação do usuário
- Saldo de tempo disponível
- Status atual da tentativa
- Estado do timer

Essas verificações determinam quais elementos da interface são exibidos e qual funcionalidade está disponível para o usuário a cada momento.