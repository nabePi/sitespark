# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SiteSpark is an AI-powered website builder SaaS. Users create landing pages through natural language chat with AI. The architecture consists of:

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Go 1.21 + Gin framework + GORM (primary), with legacy Node.js/Express backend
- **Database**: PostgreSQL with GORM (Go) / Prisma (Node.js legacy)
- **Cache**: Redis
- **AI**: Kimi Code API (K2.5 model)
- **Deployment**: Docker + Dokploy-ready with Traefik

## Common Commands

### Development (Docker - Recommended)
```bash
# Start all services (PostgreSQL, Redis, backend, frontend)
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop all services
docker-compose down
```

### Backend (Go)
```bash
cd apps/backend-go

# Install dependencies
go mod download

# Run development server
go run cmd/api/main.go

# Build binary
go build -o main cmd/api/main.go

# Run tests
go test ./...

# Run specific test
go test ./internal/handlers -v
```

### Frontend
```bash
cd apps/frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

### Legacy Backend (Node.js)
```bash
cd apps/backend

# Install dependencies
npm install

# Development with hot reload
npm run dev

# Database operations
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations
npm run db:seed        # Seed database
npm run db:studio      # Open Prisma Studio

# Lint
npm run lint
npm run typecheck
```

### Shared Types Package
```bash
cd packages/shared-types

# Build
npm run build

# Watch mode
npm run dev
```

## Architecture

### Backend Go Structure (`apps/backend-go/`)

The Go backend follows clean architecture with dependency injection:

```
cmd/api/main.go              # Entry point - wires all dependencies
internal/
├── config/                  # Viper configuration loading
├── database/                # GORM connection + migrations
├── models/                  # GORM models (User, Website, TokenTransaction)
├── handlers/                # HTTP handlers (auth, user, website, ai, token, deploy)
├── middleware/              # Gin middleware (auth, CORS, logging, errors)
├── services/
│   ├── ai/kimi.go          # Kimi API client for AI generation
│   ├── token/manager.go    # Token economy business logic
│   └── website/generator.go # Website generation orchestration
└── utils/
    ├── jwt.go              # JWT token generation/validation
    └── response.go         # Standardized API response helpers
```

**Key architectural patterns:**
- Handlers depend on services and database
- Services encapsulate business logic (token economy, AI generation)
- Middleware handles cross-cutting concerns (auth, logging, CORS)
- All API responses use standardized format via `utils.Response()`

**API Response Format:**
```json
{"success": true, "data": {...}}
{"success": false, "error": {"code": "...", "message": "..."}}
```

### Frontend Structure (`apps/frontend/`)

```
src/
├── components/
│   ├── auth/               # Login/register forms, ProtectedRoute
│   ├── chat/               # AI chat interface components
│   ├── deploy/             # Deployment UI
│   ├── layout/             # RootLayout, DashboardLayout
│   ├── preview/            # Website preview components
│   └── ui/                 # shadcn/ui components (Button, Card, etc.)
├── pages/                  # Route components
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities, API clients (axios config)
├── stores/                 # Zustand state management
└── types/                  # TypeScript type definitions
```

**Key frontend patterns:**
- React Router for routing with protected/public route guards
- Zustand for state management (auth store, website store)
- TanStack Query for server state
- Axios interceptors for JWT token handling
- shadcn/ui components use Radix UI primitives + Tailwind

### Database Models

**User**: `id`, `email`, `password`, `name`, `subscriptionTier` (default: 'free'), `tokensBalance` (default: 100)

**Website**: `id`, `userId`, `subdomain` (unique), `customDomain`, `title`, `status` (draft/published/archived), `config` (JSON), `designTokens` (JSON), `generatedContent` (JSON)

**TokenTransaction**: `id`, `userId`, `amount` (+/-), `balanceAfter`, `type` (signup_bonus, daily_login, website_generation), `relatedWebsiteId`

### Token Economy

- Signup bonus: 100 tokens
- Daily login: 10 tokens (claim via POST /api/tokens/daily)
- Website generation: -50 tokens
- All token operations are atomic and logged in TokenTransaction

### Environment Variables

**Backend (`apps/backend-go/.env`):**
```
SERVER_PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=sitespark
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
KIMI_API_KEY=your-kimi-api-key
KIMI_BASE_URL=https://api.moonshot.cn/v1
```

**Frontend (`apps/frontend/.env`):**
```
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

## API Endpoints

All routes prefixed with `/api`:

- `POST /api/auth/register` - Register (awards 100 tokens)
- `POST /api/auth/login` - Login, returns JWT
- `POST /api/auth/refresh` - Refresh JWT
- `GET /api/auth/me` - Current user (protected)
- `GET /api/user/profile` - Get profile (protected)
- `PUT /api/user/profile` - Update profile (protected)
- `GET /api/websites` - List user's websites (protected)
- `POST /api/websites` - Create website (protected)
- `PUT /api/websites/:id` - Update website (protected)
- `DELETE /api/websites/:id` - Delete website (protected)
- `POST /api/ai/generate` - Generate website with AI, costs 50 tokens (protected)
- `POST /api/ai/chat` - Chat with AI (optional auth)
- `GET /api/tokens/balance` - Get token balance (protected)
- `POST /api/tokens/daily` - Claim daily 10 tokens (protected)
- `POST /api/deploy` - Deploy website (protected)

## Important Notes

- The Go backend in `apps/backend-go/` is the **primary/active** backend
- The Node.js backend in `apps/backend/` is **legacy** and kept for reference
- GORM auto-migrates models on startup
- JWT tokens expire in 24 hours
- Frontend uses path aliases (`@/components`, `@/lib`) configured in `vite.config.ts`
- Docker Compose mounts bind volumes for development hot-reload
