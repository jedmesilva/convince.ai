# Replit.md - AI Prize Persuader Application

## Overview

This is a React-based web application that implements an interactive AI persuasion game. Users pay $1 to engage with an AI avatar and attempt to persuade it to give them a monetary prize. The application features a gamified experience with real-time statistics, visual feedback, and payment integration.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theme variables
- **State Management**: React hooks for local state management
- **Routing**: React Router for client-side navigation
- **Data Fetching**: TanStack Query for server state management

### Backend Architecture
- **Runtime**: Node.js with TypeScript support
- **Server**: Custom HTTP server (no Express framework)
- **Database ORM**: Drizzle configured for PostgreSQL
- **Development Setup**: Combined server approach with Vite proxy

## Key Components

### Core Game Components
1. **AiAvatar**: Animated AI character with persuasion level indicator
2. **ChatInterface**: Real-time chat with AI including timer functionality
3. **PrizeDisplay**: Shows current prize amount and failed attempts counter
4. **PaymentPrompt**: Handles $1 payment to unlock chat
5. **BorderTimer**: Visual countdown timer for chat sessions

### UI Components
- Complete Shadcn/ui component library implementation
- Custom toast notifications system
- Responsive design with mobile support
- Dark theme with purple color scheme

### Data Management
- **AttemptsList**: Displays real-time failed attempts from other users
- **UserEmail**: Shows current user information
- Real-time statistics updates

## Data Flow

1. **Initial Load**: User sees AI avatar, prize amount, and failed attempts list
2. **Payment Flow**: User clicks payment button → Payment dialog → Processing → Chat unlocked
3. **Chat Session**: 2-minute timer starts → User chats with AI → Persuasion level updates
4. **Session End**: Timer expires → Chat locks → Failed attempts increment → Prize increases by $1
5. **Statistics Update**: Real-time updates to prize pool and attempts counter

## External Dependencies

### Core Dependencies
- React ecosystem (React, React DOM, React Router)
- UI components (Radix UI primitives, Lucide React icons)
- Styling (Tailwind CSS, class-variance-authority)
- Development tools (Vite, TypeScript, ESLint)
- Date handling (date-fns)
- Form management (React Hook Form)

### Database
- Drizzle ORM for PostgreSQL integration
- Configured but not yet implemented in current codebase

## Deployment Strategy

### Development Environment
- **Primary Server**: Vite dev server on port 8080
- **Production Build**: Static files generated via `npm run build`
- **Development Command**: `npm run dev` starts Vite development server

### Production Deployment
- **Build Process**: Vite builds optimized static assets
- **Server Configuration**: Node.js server serves built files
- **Environment**: Designed for deployment on platforms like Replit

### Port Configuration
- Port 5000: Main application server
- Port 8080: Vite development server
- Port 8081: Additional development port

## Changelog
- June 27, 2025: Initial setup
- June 27, 2025: Layout UX/UI improvements - Reorganized layout structure with improved grid system, enhanced chat interface with better visual hierarchy, optimized AttemptsList as side panel, improved PrizeDisplay with better visual emphasis, and enhanced responsive design for both desktop and mobile

## User Preferences

Preferred communication style: Simple, everyday language.