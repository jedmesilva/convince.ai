MARKDOWN DETALHANDO O DATABASE SUPABASE COM RLS POLICES (PARA A AI):

# 📦 Database Structure & RLS Policies

## 🧠 Context
Este projeto gerencia um sistema de tentativa de convencimento da AI para “roubar o prêmio”:
- Usuários (convincers)
- Tentativas de persuasão
- Mensagens e respostas
- Tempo comprado pelo usuário
- Prêmios e certificados
- Saques

Todas as tabelas estão no schema `public`.

---

## 🗂️ Tabelas e Relacionamentos

### 1️⃣ convincers
**Descrição:** Usuários que tentam convencer a AI.

| Campo | Tipo | Detalhes |
|------|------|---------|
| id | uuid (PK) | Identificador único |
| name | text | Nome do usuário |
| email | text | Único |
| status | text | Default: `active` |
| created_at | timestamp | Default: now() |
| updated_at | timestamp | Default: now() |

---

### 2️⃣ attempts
**Descrição:** Tentativas de persuasão iniciadas por usuários.

| Campo | Tipo | Detalhes |
|------|------|---------|
| id | uuid (PK) | Identificador |
| convincer_id | uuid (FK → convincers.id) | Usuário dono |
| status | text | Default: `active` |
| available_time_seconds | integer | Tempo que o usuário comprou para a tentativa |
| convincing_score | integer | Score atual (0-100) |
| created_at | timestamp | Default: now() |
| updated_at | timestamp | Default: now() |

---

### 3️⃣ messages
**Descrição:** Mensagens enviadas pelo usuário dentro de uma tentativa.

| Campo | Tipo | Detalhes |
|------|------|---------|
| id | uuid (PK) | Identificador |
| attempt_id | uuid (FK → attempts.id) | Tentativa |
| convincer_id | uuid (FK → convincers.id) | Usuário que enviou |
| message | text | Conteúdo |
| convincing_score_snapshot | integer | Score no momento |
| status | text | Default: `sent` |
| created_at | timestamp | Default: now() |
| updated_at | timestamp | Default: now() |

---

### 4️⃣ ai_responses
**Descrição:** Respostas da AI às mensagens do usuário.

| Campo | Tipo | Detalhes |
|------|------|---------|
| id | uuid (PK) | Identificador |
| attempt_id | uuid (FK → attempts.id) | Tentativa |
| user_message_id | uuid (FK → messages.id) | Mensagem do usuário |
| ai_response | text | Conteúdo |
| convincing_score_snapshot | integer | Score no momento |
| status | text | Default: `sent` |
| created_at | timestamp | Default: now() |
| updated_at | timestamp | Default: now() |

---

### 5️⃣ time_balances
**Descrição:** Saldo de tempo que o usuário comprou para usar nas tentativas.

| Campo | Tipo | Detalhes |
|------|------|---------|
| id | uuid (PK) | Identificador |
| convincer_id | uuid (FK → convincers.id) | Usuário |
| payment_id | uuid (FK → payments.id) | Referência ao pagamento |
| amount_time_seconds | integer | Tempo comprado |
| status | text | Default: `active` |
| created_at | timestamp | Default: now() |
| updated_at | timestamp | Default: now() |

---

### 6️⃣ payments
**Descrição:** Pagamentos realizados pelos usuários.

| Campo | Tipo | Detalhes |
|------|------|---------|
| id | uuid (PK) | Identificador |
| convincer_id | uuid (FK → convincers.id) | Usuário |
| amount_paid | numeric(10,2) | Valor pago |
| time_purchased_seconds | integer | Tempo comprado |
| status | text | Default: `pending` |
| created_at | timestamp | Default: now() |
| updated_at | timestamp | Default: now() |

---

### 7️⃣ prizes
**Descrição:** Prêmios disponíveis no sistema.

| Campo | Tipo | Detalhes |
|------|------|---------|
| id | uuid (PK) | Identificador |
| amount | numeric(10,2) | Valor do prêmio |
| distributed_at | timestamp | Quando foi ganho |
| winner_convincer_id | uuid (FK → convincers.id) | Ganhador |
| status | text | Default: `open` |
| created_at | timestamp | Default: now() |
| updated_at | timestamp | Default: now() |

---

### 8️⃣ prize_certificates
**Descrição:** Certificados que comprovam que o usuário ganhou o prêmio.

| Campo | Tipo | Detalhes |
|------|------|---------|
| id | uuid (PK) | Identificador |
| convincer_id | uuid (FK → convincers.id) | Usuário ganhador |
| prize_id | uuid (FK → prizes.id) | Prêmio relacionado |
| hash | text | Hash único |
| status | text | Default: `active` |
| created_at | timestamp | Default: now() |
| updated_at | timestamp | Default: now() |

---

### 9️⃣ withdrawals
**Descrição:** Saques feitos pelos usuários dos valores ganhos.

| Campo | Tipo | Detalhes |
|------|------|---------|
| id | uuid (PK) | Identificador |
| convincer_id | uuid (FK → convincers.id) | Usuário que saca |
| prize_id | uuid (FK → prizes.id) | Prêmio sacado |
| certificate_id | uuid (FK → prize_certificates.id) | Certificado vinculado |
| hash | text | Hash do certificado |
| amount_withdrawn | numeric(10,2) | Valor sacado |
| requested_at | timestamp | Quando foi solicitado |
| completed_at | timestamp | Quando foi concluído |
| status | text | Default: `pending` |
| description | text | Info extra |
| created_at | timestamp | Default: now() |
| updated_at | timestamp | Default: now() |

---

## 🔒 RLS (Row-Level Security) Policies

### Padrão geral:
| Tabela | Leitura (SELECT) | Criação (INSERT) | Atualização (UPDATE) |
|-------|------------------|-----------------|--------------------|
| **convincers** | Todos podem ver dados públicos | Apenas usuários autenticados podem criar | Usuário só pode editar o próprio perfil |
| **attempts** | Todos podem ver tentativas | Usuário autenticado pode criar | Usuário só edita as suas tentativas |
| **messages** | Todos podem ver | Usuário autenticado pode criar | Usuário só edita as próprias mensagens |
| **ai_responses** | Todos podem ver | Sistema cria | N/A |
| **time_balances** | Apenas usuário dono | Sistema cria | Usuário só vê/edita o que é dele |
| **payments** | Apenas usuário dono | Usuário cria | Usuário só edita os seus |
| **prizes** | Todos podem ver | Sistema cria | Apenas admin atualiza |
| **prize_certificates** | Apenas usuário dono | Sistema cria | Usuário só edita o que é dele |
| **withdrawals** | Apenas usuário dono | Usuário cria | Usuário só edita o que é dele |

---

## ✅ Observações
- Todas as tabelas estão **com RLS ativado**.
- Para tabelas públicas (tentativas, mensagens, prêmios, respostas), qualquer um pode visualizar.
- Para tabelas sensíveis (saques, pagamentos, certificados), só o dono vê.

---

## 📌 Dica para desenvolvedores
Use as foreign keys como guia para montar consultas e joins.  
**Exemplo:** Para listar mensagens de uma tentativa:
```sql
select * from messages where attempt_id = '...';