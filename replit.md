# Overview

This is a React-based web application called "ai-prize-persuader" that challenges users to convince an AI to give them a prize. The app features a dual-interface design with a prize display component showing the current jackpot and a chat interface where users attempt to persuade the AI. Users must pay $1 to participate, and the system tracks failed attempts to increase engagement.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with a dark theme configuration
- **State Management**: React hooks with @tanstack/react-query for server state
- **Routing**: React Router for client-side navigation

## Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **WebSocket**: WebSocket Server for real-time communication
- **Session Management**: Cookie-based sessions with UUID generation
- **Storage**: In-memory storage implementation (MemStorage class)

# Key Components

## Prize Display System
- Shows current prize amount and failed attempts counter
- Displays recent failed attempts with fake user data
- Real-time updates of statistics
- Responsive design for mobile and desktop views

## Chat Interface
- AI conversation system with convincement scoring
- 30-second timer for user responses
- Argument analysis based on keywords and writing quality
- Payment integration before chat access
- WebSocket connection for real-time communication

## Payment System
- $1 payment requirement to access chat
- Mock payment dialog with credit card and PIX options
- Payment processing simulation with success/failure states
- Session-based payment tracking

## Data Models
- **Users**: Basic user authentication (username/password)
- **Messages**: Chat messages with session tracking
- **Payments**: Payment records with status tracking

# Data Flow

1. **User Entry**: User lands on prize display page showing current jackpot
2. **Payment**: User clicks to chat and is prompted to pay $1
3. **Chat Session**: After payment, user enters chat interface
4. **AI Interaction**: User attempts to convince AI with timed responses
5. **Scoring**: System analyzes arguments and updates convincement meter
6. **Result**: Success leads to prize, failure increments counter and prize amount

# External Dependencies

## Frontend Dependencies
- **React Ecosystem**: react, react-dom, react-router-dom
- **UI Framework**: @radix-ui components, lucide-react icons
- **Styling**: tailwindcss, class-variance-authority, clsx
- **Forms**: react-hook-form, @hookform/resolvers
- **Data Fetching**: @tanstack/react-query
- **Utilities**: date-fns, embla-carousel-react

## Backend Dependencies
- **Server**: express, ws (WebSocket)
- **Database**: drizzle-orm with PostgreSQL dialect
- **Utilities**: uuid generation, cookie parsing

## Development Tools
- **Build**: vite, @vitejs/plugin-react-swc
- **TypeScript**: Full TypeScript setup with strict configuration
- **Linting**: ESLint with TypeScript and React rules
- **Component Tagging**: lovable-tagger for development

# Deployment Strategy

## Environment Configuration
- **Development**: Vite dev server on port 8080, Express server on port 5000
- **Production**: Static build served with Express server
- **Database**: PostgreSQL configured via DATABASE_URL environment variable

## Build Process
- **Development**: `npm run dev` - starts Vite and Express concurrently
- **Production**: `npm run build` - creates optimized static build
- **Deployment**: Replit autoscale deployment with port 80 external mapping

## Server Setup
- Combined server approach with Express handling API routes
- Static file serving for production builds
- WebSocket server integration for real-time features
- Health check endpoints for monitoring

# Changelog

Changelog:
- June 27, 2025. Initial setup
- June 29, 2025. Implementado sistema de time_balances único por usuário:
  * Corrigida estrutura para um saldo único por usuário (não um registro por pagamento)
  * Implementados endpoints para consultar e atualizar saldo em tempo real
  * Timer do chat agora decrementa saldo real do banco de dados a cada segundo
  * Sistema de pagamento agora acumula tempo no saldo existente do usuário
- July 2, 2025. Implementado sistema de atualização em tempo real do convincing_score:
  * Configurado WebSocket entre frontend e backend para comunicação em tempo real
  * Backend configurado para escutar mudanças na tabela attempts do Supabase via realtime
  * Frontend conecta ao WebSocket durante tentativas ativas e recebe atualizações automáticas
  * Corrigido valor inicial do convincing_score de 15 para 0 (tanto frontend quanto backend)
- July 2, 2025. Corrigido sistema de índices das tentativas para usar dados reais:
  * API `/api/recent-attempts` agora usa diretamente a view `view_attempts_with_prizes`
  * Utiliza o campo `attempt_index` que já existe no banco em vez de recalcular
  * Solução mais robusta e eficiente, evitando vulnerabilidades de recálculo
  * Frontend agora mostra os índices reais das tentativas (30ª, 29ª, etc.)
- July 2, 2025. Otimização crítica do sistema de timer para eliminar travamentos:
  * Implementado timer local que conta sem requisições HTTP (elimina 3.600 requisições/hora)
  * Sistema de sincronização inteligente: salva no banco a cada 15 segundos em lotes
  * Backup com sendBeacon para sincronização ao sair da página
  * Indicador visual de sincronização pendente no timer
  * Performance drasticamente melhorada: timer fluido sem travamentos
- July 3, 2025. Corrigido botão "Atualizar Dados" na página AttemptHistory:
  * Problema: página importava componente demo com função vazia em vez do componente funcional
  * Solução: implementado comunicação via eventos customizados entre componente e página
  * Botão agora funciona corretamente e navega para tela de atualização de dados

# User Preferences

Preferred communication style: Simple, everyday language.