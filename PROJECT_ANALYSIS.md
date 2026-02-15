# SiteSpark - Comprehensive Project Analysis

> **Last Updated**: 2026-02-15
> **Project Type**: AI-Powered Website Builder SaaS
> **Architecture**: Full-Stack Monorepo (React + Go)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Frontend Deep Dive](#3-frontend-deep-dive)
4. [Backend Deep Dive](#4-backend-deep-dive)
5. [Database Schema](#5-database-schema)
6. [API Reference](#6-api-reference)
7. [AI System Architecture](#7-ai-system-architecture)
8. [Key Features](#8-key-features)
9. [Code Patterns & Conventions](#9-code-patterns--conventions)
10. [Environment Configuration](#10-environment-configuration)
11. [Development Workflow](#11-development-workflow)
12. [Appendix: Current vs Planned](#appendix-current-vs-planned)

---

## 1. Project Overview

### 1.1 Description
SiteSpark is an AI-powered website builder that enables users to create landing pages through natural language chat with AI. The platform uses a 6-step conversational workflow to gather requirements and generates complete websites.

### 1.2 Key Capabilities
- **AI Chat Interface**: Natural language website creation
- **6-Step Workflow**: Business type → Name → Audience → Features → Style → Contact
- **Token Economy**: Monetization through token-based pricing
- **Real-time Preview**: Live website preview during generation
- **One-Click Deploy**: Static site generation and deployment

### 1.3 Tech Stack Summary
| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand + TanStack Query |
| Backend | Go 1.21 + Gin |
| Database | PostgreSQL + GORM |
| Cache | Redis |
| AI | Kimi API (OpenAI-compatible) |
| WebSocket | Gorilla WebSocket |
| Auth | JWT |

---

## 2. Architecture Overview

### 2.1 Directory Structure

```
sitespark/
├── apps/
│   ├── backend-go/          # Primary Go backend (ACTIVE)
│   ├── backend/             # Legacy Node.js backend (DEPRECATED)
│   ├── frontend/            # React + TypeScript SPA
│   └── docs/                # Documentation
├── packages/
│   └── shared-types/        # Shared TypeScript definitions
├── e2e/                     # Playwright E2E tests
├── docker-compose.yml       # Local development orchestration
├── nginx/                   # Production nginx config
└── scripts/                 # Deployment scripts
```

### 2.2 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Browser    │  │   Browser    │  │   Browser    │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
└─────────┼─────────────────┼─────────────────┼───────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │ HTTPS/WebSocket
┌───────────────────────────▼─────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Nginx (Reverse Proxy + Static Files)                │   │
│  │  - Serves React SPA on port 3002                     │   │
│  │  - Proxies API to backend on port 3001               │   │
│  └────────────────────┬─────────────────────────────────┘   │
└───────────────────────┼─────────────────────────────────────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
┌────────▼────────┐ ┌───▼────────┐ ┌───▼──────────┐
│  Frontend App   │ │  Go API    │ │  WebSocket   │
│  (React/Vite)   │ │  (Gin)     │ │  Endpoint    │
│                 │ │            │ │  (/ws)       │
└─────────────────┘ └─────┬──────┘ └──────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
   ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
   │ PostgreSQL  │ │    Redis    │ │  Kimi API   │
   │   (Data)    │ │   (Cache)   │ │  (AI/LLM)   │
   └─────────────┘ └─────────────┘ └─────────────┘
```

### 2.3 Data Flow

1. **Authentication Flow**:
   ```
   User Login → JWT Generation → localStorage Storage → Axios Interceptor → API Calls
   ```

2. **Website Generation Flow**:
   ```
   Chat Answers → Compile Prompt → API Call → Token Check → AI Generation → DB Save → Response
   ```

3. **Real-time Chat Flow**:
   ```
   User Message → WebSocket Send → AI Stream Processing → Chunk Response → UI Update
   ```

---

## 3. Frontend Deep Dive

### 3.1 Tech Stack Details

**Core Dependencies**:
```json
{
  "react": "^18.2.0",
  "react-router-dom": "^6.21.0",
  "@tanstack/react-query": "^5.17.0",
  "zustand": "^4.4.7",
  "axios": "^1.6.2",
  "framer-motion": "^10.16.16",
  "lucide-react": "^0.294.0",
  "tailwindcss": "^3.4.0"
}
```

### 3.2 Directory Structure

```
apps/frontend/src/
├── App.tsx                    # Route configuration
├── main.tsx                   # Entry point
├── components/
│   ├── auth/                  # Authentication components
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── chat/
│   │   └── ChatInterface.tsx  # Main chat UI with workflow
│   ├── deploy/
│   │   └── AutoDeploy.tsx     # Deployment trigger
│   ├── layout/
│   │   ├── DashboardLayout.tsx
│   │   ├── Header.tsx
│   │   ├── RootLayout.tsx
│   │   └── Sidebar.tsx
│   ├── preview/
│   │   └── WebsitePreview.tsx # Live preview iframe
│   └── ui/                    # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── scroll-area.tsx
│       └── ...
├── hooks/
│   ├── useAuth.ts             # Auth logic
│   ├── useChat.ts             # Chat workflow management
│   └── useWebsite.ts          # Website CRUD
├── lib/
│   ├── api.ts                 # Axios client + API methods
│   ├── socket.ts              # WebSocket client
│   └── utils.ts               # Utilities
├── pages/
│   ├── LandingPage.tsx
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   ├── chat/
│   │   └── ChatPage.tsx
│   ├── dashboard/
│   │   └── DashboardPage.tsx
│   ├── forms/
│   │   └── FormBuilderPage.tsx
│   ├── tokens/
│   │   └── TokenWalletPage.tsx
│   └── websites/
│       ├── PreviewPage.tsx
│       └── WebsitesListPage.tsx
├── stores/
│   ├── auth.store.ts
│   ├── chat.store.ts
│   ├── token.store.ts
│   └── website.store.ts
├── types/
│   └── index.ts
└── styles/
    └── globals.css
```

### 3.3 State Management

#### 3.3.1 Auth Store (`stores/auth.store.ts`)
```typescript
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}
```
- **Persistence**: JWT token in localStorage
- **Hydration**: Restores session on page load

#### 3.3.2 Chat Store (`stores/chat.store.ts`)
```typescript
interface WorkflowState {
  step: 'initial' | 'business_type' | 'business_name' |
        'target_audience' | 'features' | 'style' |
        'contact_info' | 'generating' | 'complete'
  data: {
    businessType?: string
    businessName?: string
    targetAudience?: string
    features?: string[]
    style?: string
    contactInfo?: string
  }
}

interface ChatState {
  messages: ChatMessage[]
  isTyping: boolean
  workflow: WorkflowState
  isGenerating: boolean
  sendMessage: (content: string) => void
  setWorkflowStep: (step: WorkflowStep) => void
  getWorkflowPrompt: () => string
}
```

#### 3.3.3 Website Store (`stores/website.store.ts`)
```typescript
interface WebsiteState {
  websites: Website[]
  currentWebsite: Website | null
  isLoading: boolean
  fetchWebsites: () => Promise<void>
  createWebsite: (data: Partial<Website>) => Promise<Website>
  updateWebsite: (id: string, data: Partial<Website>) => Promise<void>
  deleteWebsite: (id: string) => Promise<void>
  deployWebsite: (id: string) => Promise<string>
}
```

#### 3.3.4 Token Store (`stores/token.store.ts`)
```typescript
interface TokenState {
  balance: number
  transactions: TokenTransaction[]
  packages: TokenPackage[]
  fetchBalance: () => Promise<void>
  fetchTransactions: () => Promise<void>
  claimDaily: () => Promise<void>
}
```

### 3.4 Routing Configuration

```typescript
// App.tsx
<Routes>
  {/* Public Routes */}
  <Route element={<PublicRoute />}>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
  </Route>

  {/* Landing Page */}
  <Route element={<RootLayout />}>
    <Route path="/" element={<LandingPage />} />
  </Route>

  {/* Protected Dashboard */}
  <Route element={<ProtectedRoute />}>
    <Route element={<DashboardLayout />}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/websites" element={<WebsitesListPage />} />
      <Route path="/websites/:id/preview" element={<PreviewPage />} />
      <Route path="/tokens" element={<TokenWalletPage />} />
      <Route path="/forms" element={<FormBuilderPage />} />
    </Route>
  </Route>
</Routes>
```

### 3.5 API Client

```typescript
// lib/api.ts
class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
    })
    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request: Add JWT token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token')
      if (token) config.headers.Authorization = `Bearer ${token}`
      return config
    })

    // Response: Handle 401
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }
}

// API endpoints
export const authApi = { login, register, logout, me }
export const websiteApi = { list, get, create, update, delete, deploy }
export const tokenApi = { getBalance, getTransactions, claimDaily }
export const aiApi = { generate, chat }
export const formApi = { list, get, create, update, delete }
```

### 3.6 WebSocket Client

```typescript
// lib/socket.ts
class SocketClient {
  private ws: WebSocket | null
  private reconnectAttempts: number
  private messageHandlers: Map<string, Function[]>

  connect() {
    this.ws = new WebSocket(WS_URL)
    this.ws.onopen = () => { /* auth */ }
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      this.handleMessage(data)
    }
    this.ws.onclose = () => { /* reconnect */ }
  }

  sendMessage(content: string, websiteId?: string) {
    this.send({
      type: 'chat:message',
      content,
      websiteId
    })
  }

  onStream(callback: (chunk: string, messageId: string) => void) {
    return this.on('chat:stream', callback)
  }
}

export const socket = new SocketClient()
```

### 3.7 Chat Workflow Implementation

The chat uses a 6-step guided workflow:

```typescript
// hooks/useChat.ts
const workflowSteps: WorkflowStep[] = [
  'business_type',
  'business_name',
  'target_audience',
  'features',
  'style',
  'contact_info',
  'generating',
  'complete'
]

const getStepQuestion = (step: WorkflowStep): string => {
  switch (step) {
    case 'business_type':
      return `**Langkah 1 dari 6: Jenis Bisnis**
Apa jenis bisnis atau kegiatan yang ingin Anda promosikan?`
    case 'business_name':
      return `**Langkah 2 dari 6: Nama Bisnis**
Apa nama bisnis atau brand Anda?`
    // ... etc
  }
}
```

---

## 4. Backend Deep Dive

### 4.1 Go Architecture

```
apps/backend-go/
├── cmd/api/
│   └── main.go              # Entry point
├── internal/
│   ├── config/              # Configuration
│   ├── database/            # DB connection
│   ├── handlers/            # HTTP handlers
│   ├── middleware/          # Gin middleware
│   ├── models/              # GORM models
│   ├── services/            # Business logic
│   ├── utils/               # Utilities
│   └── websocket/           # WS manager
├── go.mod
└── Dockerfile
```

### 4.2 Main Application (`cmd/api/main.go`)

```go
func main() {
  // 1. Load configuration
  cfg, err := config.Load()

  // 2. Initialize database
  db, err := database.Initialize(cfg)

  // 3. Initialize Redis
  redisClient := database.NewRedisClient(cfg)

  // 4. Initialize services
  kimiClient := ai.NewKimiClient(cfg.Kimi)
  tokenManager := token.NewManager(db.DB)
  websiteGenerator := website.NewGenerator(db.DB, kimiClient, tokenManager)

  // 5. Initialize handlers
  authHandler := handlers.NewAuthHandler(db.DB, cfg.JWT)
  websiteHandler := handlers.NewWebsiteHandler(db.DB, websiteGenerator)
  aiHandler := handlers.NewAIHandler(db.DB, kimiClient, tokenManager, websiteGenerator)
  tokenHandler := handlers.NewTokenHandler(tokenManager)
  wsHandler := handlers.NewWebSocketHandler(db.DB, kimiClient)

  // 6. Setup routes
  r := gin.Default()

  // 7. Start server
  r.Run(":" + cfg.Server.Port)
}
```

### 4.3 Database Models

```go
// models/models.go

type User struct {
  ID               uuid.UUID      `gorm:"primaryKey"`
  Email            string         `gorm:"uniqueIndex;not null"`
  Password         string         `gorm:"not null"`
  Name             string
  AvatarURL        string
  SubscriptionTier string         `gorm:"default:'free'"`
  TokensBalance    int            `gorm:"default:100"`
  Websites         []Website
  Transactions     []TokenTransaction
  CreatedAt        time.Time
  UpdatedAt        time.Time
}

type Website struct {
  ID               uuid.UUID      `gorm:"primaryKey"`
  UserID           uuid.UUID      `gorm:"not null"`
  User             User
  Subdomain        string         `gorm:"uniqueIndex;not null"`
  CustomDomain     *string        `gorm:"uniqueIndex"`
  Title            string
  Description      string
  TemplateID       string
  Status           string         // draft, published, archived
  Config           datatypes.JSON
  DesignTokens     datatypes.JSON
  GeneratedContent datatypes.JSON
  ViewCount        int            `gorm:"default:0"`
  PublishedAt      *time.Time
  CreatedAt        time.Time
  UpdatedAt        time.Time
}

type TokenTransaction struct {
  ID               uuid.UUID      `gorm:"primaryKey"`
  UserID           uuid.UUID      `gorm:"not null"`
  User             User
  Amount           int            // +credit, -debit
  BalanceAfter     int
  Type             string         // signup_bonus, daily_login, website_generation
  Description      string
  RelatedWebsiteID *uuid.UUID
  CreatedAt        time.Time
}

type ChatMessage struct {
  ID        uuid.UUID      `gorm:"primaryKey"`
  UserID    uuid.UUID      `gorm:"not null"`
  WebsiteID *uuid.UUID
  Role      string         // user, assistant, system
  Content   string         `gorm:"type:text"`
  CreatedAt time.Time
}
```

### 4.4 Handlers

#### 4.4.1 Auth Handler
```go
func (h *AuthHandler) Register(c *gin.Context)
func (h *AuthHandler) Login(c *gin.Context)
func (h *AuthHandler) Refresh(c *gin.Context)
func (h *AuthHandler) Me(c *gin.Context)
```

#### 4.4.2 AI Handler
```go
func (h *AIHandler) Generate(c *gin.Context) {
  // 1. Validate request
  // 2. Check token balance (50 tokens)
  // 3. Call Kimi API
  // 4. Create website
  // 5. Deduct tokens
  // 6. Return website
}

func (h *AIHandler) Chat(c *gin.Context) {
  // Handle chat messages
  // Optional auth (can be used anonymously)
}
```

#### 4.4.3 Website Handler
```go
func (h *WebsiteHandler) List(c *gin.Context)
func (h *WebsiteHandler) Get(c *gin.Context)
func (h *WebsiteHandler) Create(c *gin.Context)
func (h *WebsiteHandler) Update(c *gin.Context)
func (h *WebsiteHandler) Delete(c *gin.Context)
func (h *WebsiteHandler) Preview(c *gin.Context)  // Public, no auth
```

#### 4.4.4 Token Handler
```go
func (h *TokenHandler) GetBalance(c *gin.Context)
func (h *TokenHandler) GetTransactions(c *gin.Context)
func (h *TokenHandler) ClaimDaily(c *gin.Context)  // 10 tokens/day
```

#### 4.4.5 WebSocket Handler
```go
func (h *WebSocketHandler) Handle(c *gin.Context)
func (h *WebSocketHandler) handleMessage(client *Client, msg Message)
func (h *WebSocketHandler) handleChatMessage(client *Client, msg Message)
func (h *WebSocketHandler) handleWebsiteJoin(client *Client, msg Message)
```

### 4.5 Services

#### 4.5.1 AI Service (`services/ai/kimi.go`)

```go
type KimiClient struct {
  apiKey  string
  baseURL string
}

// Methods
func (k *KimiClient) ChatCompletion(ctx context.Context, messages []Message, maxTokens int) (*ChatResponse, error)
func (k *KimiClient) ChatCompletionStream(ctx context.Context, messages []Message, callback func(string)) error
func (k *KimiClient) GenerateWebsite(ctx context.Context, prompt, templateID string) (string, error)
func (k *KimiClient) Chat(ctx context.Context, messages []Message) (string, error)

// Demo fallback when no API key
const demoMode = true
```

**System Prompt for Website Generation**:
```
You are a website generation assistant. Generate complete website content.
Return ONLY valid JSON with this structure:
{
  "title": "Website Title",
  "description": "Meta description",
  "sections": [
    {
      "type": "hero|about|services|contact",
      "content": { ... }
    }
  ]
}
```

#### 4.5.2 Token Manager (`services/token/manager.go`)

```go
type Manager struct {
  db *gorm.DB
}

// Atomic operations with row locking
func (m *Manager) GetBalance(userID uuid.UUID) (int, error)
func (m *Manager) HasEnoughTokens(userID uuid.UUID, amount int) (bool, error)
func (m *Manager) AddTokens(userID uuid.UUID, amount int, txType string, description string) error
func (m *Manager) DeductTokens(userID uuid.UUID, amount int, txType string, description string, relatedWebsiteID *uuid.UUID) error
func (m *Manager) GetTransactions(userID uuid.UUID) ([]models.TokenTransaction, error)
func (m *Manager) AwardDailyLogin(userID uuid.UUID) (bool, error)

// Transaction types
const (
  TxSignupBonus        = "signup_bonus"
  TxDailyLogin         = "daily_login"
  TxWebsiteGeneration  = "website_generation"
  TxReferral           = "referral"
  TxPurchase           = "purchase"
)
```

#### 4.5.3 Website Generator (`services/website/generator.go`)

```go
type Generator struct {
  db          *gorm.DB
  kimiClient  *ai.KimiClient
  tokenMgr    *token.Manager
}

func (g *Generator) Generate(ctx context.Context, userID uuid.UUID, req GenerateRequest) (*models.Website, error) {
  // 1. Check and lock tokens
  // 2. Call AI to generate content
  // 3. Create website record
  // 4. Deduct tokens atomically
  // 5. Return website
}
```

### 4.6 Middleware

```go
// middleware/auth.go
func AuthRequired(cfg *config.JWTConfig) gin.HandlerFunc
func AuthOptional(cfg *config.JWTConfig) gin.HandlerFunc

// middleware/cors.go
func CORS(allowedOrigins []string) gin.HandlerFunc

// middleware/error.go
func ErrorHandler() gin.HandlerFunc
```

### 4.7 WebSocket Manager

```go
// websocket/manager.go

type Manager struct {
  clients    map[uuid.UUID]*Client
  broadcast  chan []byte
  register   chan *Client
  unregister chan *Client
}

type Client struct {
  ID     uuid.UUID
  UserID uuid.UUID
  Conn   *websocket.Conn
  Send   chan []byte
}

// Message types
const (
  MessageTypeChat           = "chat:message"
  MessageTypeStream         = "chat:stream"
  MessageTypeTyping         = "chat:typing"
  MessageTypeWebsiteJoin    = "website:join"
  MessageTypeWebsiteLeave   = "website:leave"
  MessageTypeError          = "error"
  MessageTypeConnected      = "connected"
  MessageTypeDisconnected   = "disconnected"
)
```

---

## 5. Database Schema

### 5.1 Current Implementation

#### Entity Relationship Diagram (Implemented)

```
┌─────────────────────────────────────────────────────────────────────┐
│                              USERS                                  │
├─────────────────────────────────────────────────────────────────────┤
│ id (PK)          │ uuid                                             │
│ email            │ varchar(255), unique, not null                   │
│ password         │ varchar(255), not null                           │
│ name             │ varchar(255)                                     │
│ avatar_url       │ varchar(255)                                     │
│ subscription_tier│ varchar(50), default: 'free'                     │
│ tokens_balance   │ int, default: 100                                │
│ created_at       │ timestamp                                        │
│ updated_at       │ timestamp                                        │
└──────────────────┴──────────────────────────────────────────────────┘
          │
          │ has many
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                            WEBSITES                                 │
├─────────────────────────────────────────────────────────────────────┤
│ id (PK)          │ uuid                                             │
│ user_id (FK)     │ uuid, not null → users.id                        │
│ subdomain        │ varchar(255), unique, not null                   │
│ custom_domain    │ varchar(255), unique, nullable                   │
│ title            │ varchar(255)                                     │
│ description      │ text                                             │
│ template_id      │ varchar(100)                                     │
│ status           │ varchar(50), default: 'draft'                    │
│ config           │ jsonb                                            │
│ design_tokens    │ jsonb                                            │
│ generated_content│ jsonb                                            │
│ view_count       │ int, default: 0                                  │
│ published_at     │ timestamp, nullable                              │
│ created_at       │ timestamp                                        │
│ updated_at       │ timestamp                                        │
└──────────────────┴──────────────────────────────────────────────────┘
          │
          │ has many (optional)
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       TOKEN_TRANSACTIONS                            │
├─────────────────────────────────────────────────────────────────────┤
│ id (PK)          │ uuid                                             │
│ user_id (FK)     │ uuid, not null → users.id                        │
│ amount           │ int, not null                                    │
│ balance_after    │ int, not null                                    │
│ type             │ varchar(100), not null                           │
│ description      │ varchar(255)                                     │
│ related_website_id│ uuid, nullable → websites.id                    │
│ created_at       │ timestamp                                        │
└──────────────────┴──────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         CHAT_MESSAGES                               │
├─────────────────────────────────────────────────────────────────────┤
│ id (PK)          │ uuid                                             │
│ user_id (FK)     │ uuid, not null → users.id                        │
│ website_id (FK)  │ uuid, nullable → websites.id                     │
│ role             │ varchar(50), not null                            │
│ content          │ text, not null                                   │
│ created_at       │ timestamp                                        │
└──────────────────┴──────────────────────────────────────────────────┘
```

### 5.2 Planned Schema Extensions

The following tables are planned for future implementation (see `apps/docs/sitespark-database-schema.md`):

#### Form System
```sql
CREATE TABLE form_submissions (
  id UUID PRIMARY KEY,
  website_id UUID REFERENCES websites(id),
  form_data JSONB NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Analytics System
```sql
CREATE TABLE website_analytics_daily (
  id UUID PRIMARY KEY,
  website_id UUID REFERENCES websites(id),
  date DATE NOT NULL,
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  avg_session_duration INTEGER,
  bounce_rate DECIMAL(5,2)
);

CREATE TABLE page_views (
  id UUID PRIMARY KEY,
  website_id UUID REFERENCES websites(id),
  page_path VARCHAR(500),
  referrer VARCHAR(500),
  country_code CHAR(2),
  device_type VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Token Commerce
```sql
CREATE TABLE token_packages (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  token_amount INTEGER NOT NULL,
  price_idr INTEGER NOT NULL,
  is_promo BOOLEAN DEFAULT FALSE
);

CREATE TABLE token_purchases (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  package_id UUID REFERENCES token_packages(id),
  amount_paid INTEGER NOT NULL,
  payment_method VARCHAR(50),
  payment_status VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 5.3 Indexes

```sql
-- User indexes
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Website indexes
CREATE UNIQUE INDEX idx_websites_subdomain ON websites(subdomain);
CREATE UNIQUE INDEX idx_websites_custom_domain ON websites(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX idx_websites_user_id ON websites(user_id);

-- Transaction indexes
CREATE INDEX idx_transactions_user_id ON token_transactions(user_id);
CREATE INDEX idx_transactions_created_at ON token_transactions(created_at);

-- Chat message indexes
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_website_id ON chat_messages(website_id);
```

---

## 6. API Reference

### 6.1 Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user (+100 tokens) |
| POST | `/api/auth/login` | No | Login and get JWT |
| POST | `/api/auth/refresh` | Yes | Refresh JWT token |
| GET | `/api/auth/me` | Yes | Get current user |

**Register Request**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Login Response**:
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "...", "email": "..." },
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 6.2 User

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/user/profile` | Yes | Get user profile |
| PUT | `/api/user/profile` | Yes | Update profile |

### 6.3 Websites

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/websites` | Yes | List user's websites |
| POST | `/api/websites` | Yes | Create new website |
| GET | `/api/websites/:id` | Yes | Get website details |
| PUT | `/api/websites/:id` | Yes | Update website |
| DELETE | `/api/websites/:id` | Yes | Delete website |
| GET | `/preview/:id` | No | Public preview (HTML) |

### 6.4 AI

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/ai/generate` | Yes | Generate website (-50 tokens) |
| POST | `/api/ai/chat` | Optional | Chat with AI |

**Generate Request**:
```json
{
  "prompt": "Create a coffee shop website...",
  "templateId": "modern",
  "subdomain": "my-coffee-shop"
}
```

**Generate Response**:
```json
{
  "success": true,
  "data": {
    "website": {
      "id": "...",
      "subdomain": "my-coffee-shop",
      "status": "draft"
    },
    "tokensUsed": 50
  }
}
```

### 6.5 Tokens

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/tokens/balance` | Yes | Get token balance |
| GET | `/api/tokens/transactions` | Yes | Get transaction history |
| POST | `/api/tokens/daily` | Yes | Claim daily bonus (+10) |

### 6.6 Deploy

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/deploy` | Yes | Deploy website |
| GET | `/api/deploy/list` | Yes | List deployments |

### 6.7 WebSocket

| Event | Direction | Description |
|-------|-----------|-------------|
| `chat:message` | C→S→C | Send/receive chat messages |
| `chat:stream` | S→C | Streaming AI response chunks |
| `chat:typing` | C→S→C | Typing indicators |
| `website:join` | C→S | Join website room |
| `website:leave` | C→S | Leave website room |

### 6.8 Response Format

**Success**:
```json
{
  "success": true,
  "data": { ... }
}
```

**Error**:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_TOKENS",
    "message": "You need 50 tokens to generate a website"
  }
}
```

**Error Codes**:
- `BAD_REQUEST` - Invalid input
- `UNAUTHORIZED` - Missing/invalid JWT
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource already exists
- `VALIDATION_ERROR` - Input validation failed
- `INTERNAL_ERROR` - Server error
- `INSUFFICIENT_TOKENS` - Not enough tokens

---

## 7. AI System Architecture

### 7.1 Current Implementation (Single-Stage)

Currently, the AI system uses a single-stage generation process:

```
User Prompt → Kimi API → JSON Response → Website Creation
```

The AI receives a compiled prompt from the 6-step workflow and returns structured JSON content.

### 7.2 Planned Multi-Stage Pipeline

The planned architecture (see `apps/docs/sitespark-engineering-deepdive.md`) implements a sophisticated 6-stage pipeline:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MULTI-STAGE AI PIPELINE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │ Stage 1: Intent │───▶│ Stage 2: Design │───▶│ Stage 3: Content│         │
│  │   Parsing       │    │   Decision      │    │   Generation    │         │
│  │                 │    │                 │    │                 │         │
│  │ • Business type │    │ • Color palette │    │ • Hero section  │         │
│  │ • Audience      │    │ • Typography    │    │ • Services      │         │
│  │ • Goals         │    │ • Layout grid   │    │ • About/Contact │         │
│  │ • Features      │    │ • Spacing scale │    │ • CTA copy      │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│           │                                              │                   │
│           │         ┌─────────────────┐    ┌─────────────────┐              │
│           │         │ Stage 6: Deploy │◀───│ Stage 5: Comp-  │              │
│           │         │                 │    │    onent        │              │
│           │         │ • Build static  │    │   Assembly      │              │
│           │         │ • Optimize      │    │                 │              │
│           │         │ • Deploy to CDN │    │ • React/HTML    │              │
│           │         │ • Cache invalid │    │ • Tailwind CSS  │              │
│           │         │                 │    │ • Responsive    │              │
│           │         └─────────────────┘    └─────────────────┘              │
│           │                                              ▲                   │
│           │         ┌─────────────────┐                   │                   │
│           └────────▶│ Stage 4: Image  │───────────────────┘                   │
│                     │   Generation      │                                       │
│                     │                   │                                       │
│                     │ • Hero images     │                                       │
│                     │ • Icons/graphics  │                                       │
│                     │ • Backgrounds     │                                       │
│                     │                   │                                       │
│                     └─────────────────┘                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.3 Prompt Version Control System

The planned system includes sophisticated prompt management:

```go
// models/prompt_version.go
type PromptVersion struct {
  ID            uuid.UUID
  Name          string    // e.g., "v2.1-content-generation"
  Stage         string    // "intent_parsing", "design_decision", etc.
  PromptText    string
  ModelConfig   JSONB     // temperature, max_tokens, etc.
  SuccessRate   float64   // from A/B testing
  IsActive      bool
  CreatedAt     time.Time
}
```

**A/B Testing Framework**:
- Multiple prompt variants per stage
- Track success rate per version
- Gradual rollout (10% → 50% → 100%)
- Automatic rollback on quality degradation

### 7.4 AI Cost Analysis

| Stage | Model | Input Tokens | Output Tokens | Cost (USD) |
|-------|-------|--------------|---------------|------------|
| Intent Parsing | GPT-4o-mini | 500 | 200 | $0.0030 |
| Design Decision | GPT-4o-mini | 400 | 300 | $0.0033 |
| Content Generation | GPT-4o | 800 | 2,000 | $0.0600 |
| Image Generation | DALL-E 3 | 1 image | - | $0.0400 |
| Component Assembly | GPT-4o | 1,000 | 3,000 | $0.0950 |
| **Total** | - | - | - | **~$0.11** |

**Converted**: ~$0.11 ≈ **Rp 1,800** per website (at Rp 16,500/USD)

---

## 8. Key Features

### 8.1 Authentication Flow

```
1. User submits login credentials
2. Backend validates email/password
3. JWT token generated (24h expiry)
4. Token stored in localStorage
5. Axios interceptor adds token to requests
6. Auth middleware validates on protected routes
7. On 401 error → redirect to login
```

### 8.2 Token Economy

| Action | Token Change | Description |
|--------|--------------|-------------|
| Sign up | +100 | Welcome bonus |
| Daily login | +10 | Once per 24 hours |
| Generate website | -50 | Per generation |
| Purchase | Variable | Buy more tokens |

**Implementation**:
- Atomic transactions with `FOR UPDATE` row locking
- Transaction table for audit trail
- Balance checked before any deduction

### 8.3 Website Generation Workflow

```
1. User answers 6 questions via chat
2. Frontend compiles answers into prompt
3. User confirms → call /api/ai/generate
4. Backend checks token balance
5. Call Kimi API with compiled prompt
6. Parse AI response (JSON)
7. Create website record
8. Deduct 50 tokens (atomic)
9. Return website data
10. Frontend shows preview
```

### 8.4 Real-time Chat

```
1. User connects to WebSocket (/ws)
2. Send JWT for authentication
3. Join website room (optional)
4. Send chat:message
5. Server processes with AI
6. Stream response via chat:stream
7. Frontend updates UI chunk by chunk
```

### 8.5 Website Preview

The preview endpoint (`GET /preview/:id`) renders HTML from stored JSON:

```go
func (h *WebsiteHandler) Preview(c *gin.Context) {
  // 1. Get website by ID
  // 2. Parse GeneratedContent JSON
  // 3. Render HTML with embedded CSS
  // 4. Return text/html response
}
```

---

## 9. Code Patterns & Conventions

### 9.1 Frontend Patterns

**Zustand Store Pattern**:
```typescript
export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // State
      data: null,
      isLoading: false,

      // Actions
      fetchData: async () => {
        set({ isLoading: true })
        try {
          const data = await api.getData()
          set({ data, isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      }
    }),
    {
      name: 'store-name',
      partialize: (state) => ({ data: state.data })
    }
  )
)
```

**React Hook Pattern**:
```typescript
export function useFeature() {
  const { data, fetchData } = useFeatureStore()

  useEffect(() => {
    if (!data) fetchData()
  }, [data, fetchData])

  return { data }
}
```

**Component Pattern**:
```typescript
interface ComponentProps {
  prop1: string
  prop2?: number
}

export function Component({ prop1, prop2 = 0 }: ComponentProps) {
  return <div>{prop1}</div>
}
```

### 9.2 Backend Patterns

**Handler Pattern**:
```go
type Handler struct {
  db *gorm.DB
  service *services.Service
}

func NewHandler(db *gorm.DB, svc *services.Service) *Handler {
  return &Handler{db: db, service: svc}
}

func (h *Handler) Action(c *gin.Context) {
  // 1. Bind request
  var req RequestBody
  if err := c.ShouldBindJSON(&req); err != nil {
    utils.BadRequest(c, "Invalid request")
    return
  }

  // 2. Call service
  result, err := h.service.Action(req)
  if err != nil {
    utils.Error(c, err)
    return
  }

  // 3. Return response
  utils.JSONSuccess(c, http.StatusOK, result)
}
```

**Service Pattern**:
```go
type Service struct {
  db *gorm.DB
  client *external.Client
}

func NewService(db *gorm.DB, client *external.Client) *Service {
  return &Service{db: db, client: client}
}

func (s *Service) Operation(ctx context.Context) error {
  return s.db.Transaction(func(tx *gorm.DB) error {
    // Atomic operations
    return nil
  })
}
```

### 9.3 Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ChatInterface.tsx` |
| Hooks | camelCase, use prefix | `useChat.ts` |
| Stores | camelCase | `chat.store.ts` |
| Go files | snake_case | `auth_handler.go` |
| Go structs | PascalCase | `AuthHandler` |
| Go interfaces | PascalCase | `HandlerInterface` |
| Database tables | snake_case, plural | `token_transactions` |

---

## 10. Environment Configuration

### 10.1 Backend Environment Variables

```bash
# Server
SERVER_PORT=3001
SERVER_ENV=development
SERVER_ALLOW_ORIGINS=*

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=sitespark
DB_SSL_MODE=disable

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=24h

# AI (Kimi/OpenAI)
KIMI_API_KEY=your-api-key
KIMI_BASE_URL=https://api.openai.com/v1
```

### 10.2 Frontend Environment Variables

```bash
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=ws://localhost:3001
```

### 10.3 Docker Compose Configuration

```yaml
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: sitespark
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./apps/backend-go
    environment:
      DB_HOST: db
      REDIS_HOST: redis
      KIMI_API_KEY: ${KIMI_API_KEY}
    ports:
      - "3001:3001"

  frontend:
    build: ./apps/backend-go
    ports:
      - "3002:80"
```

---

## 11. Development Workflow

### 11.1 Local Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down
```

### 11.2 Frontend Development

```bash
cd apps/frontend
npm install
npm run dev        # Vite dev server on :5173
npm run build      # Production build
npm run lint       # ESLint
```

### 11.3 Backend Development

```bash
cd apps/backend-go
go mod download
go run cmd/api/main.go    # Dev server on :3001
go test ./...             # Run tests
go build -o main cmd/api/main.go  # Build binary
```

### 11.4 Database Migrations

GORM auto-migrates on startup:
```go
// database/database.go
db.AutoMigrate(
  &models.User{},
  &models.Website{},
  &models.TokenTransaction{},
  &models.ChatMessage{},
)
```

### 11.5 Testing

**E2E Tests** (Playwright):
```bash
cd e2e
npm install
npx playwright test
```

---

## Appendix: Current vs Planned

### A.1 Current Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| User Auth | ✅ Implemented | JWT-based |
| Token Economy | ✅ Implemented | Basic transactions |
| Website Generation | ✅ Implemented | Single-stage AI |
| WebSocket Chat | ✅ Implemented | Real-time streaming |
| Website Preview | ✅ Implemented | HTML from JSON |
| Form Builder | 🟡 Partial | UI only, no backend |
| Template System | 🟡 Partial | template_id field only |
| Analytics | ❌ Not Implemented | Planned |
| Image Generation | ❌ Not Implemented | Planned (DALL-E 3) |
| Multi-stage AI | ❌ Not Implemented | Planned |
| Kubernetes Deploy | ❌ Not Implemented | Planned |

### A.2 Key Documentation References

| Document | Purpose |
|----------|---------|
| `apps/docs/sitespark-database-schema.md` | Complete planned PostgreSQL schema |
| `apps/docs/sitespark-engineering-deepdive.md` | Production architecture & AI pipeline |
| `apps/docs/sitespark-prompt-engineering.md` | Prompt version control & A/B testing |
| `apps/docs/sitespark-kubernetes-manifests.md` | K8s deployment configuration |
| `apps/docs/BACKEND_REBUILD_GO.md` | Go migration architecture decisions |

### A.3 Critical Files

| Purpose | Path |
|---------|------|
| Entry Point (Go) | `apps/backend-go/cmd/api/main.go` |
| Entry Point (React) | `apps/frontend/src/main.tsx` |
| Routes | `apps/frontend/src/App.tsx` |
| API Client | `apps/frontend/src/lib/api.ts` |
| Socket Client | `apps/frontend/src/lib/socket.ts` |
| Database Models | `apps/backend-go/internal/models/models.go` |
| Auth Handler | `apps/backend-go/internal/handlers/auth.go` |
| AI Handler | `apps/backend-go/internal/handlers/ai.go` |
| Token Service | `apps/backend-go/internal/services/token/manager.go` |
| AI Service | `apps/backend-go/internal/services/ai/kimi.go` |

### A.4 Common Tasks

#### Add New API Endpoint

1. **Backend**:
   - Add handler method in `internal/handlers/`
   - Register route in `cmd/api/main.go`
   - Add service logic if needed

2. **Frontend**:
   - Add API method in `lib/api.ts`
   - Add types in `types/index.ts`
   - Create/use hook for data fetching

#### Add New Database Model

1. Add struct in `internal/models/models.go`
2. Auto-migrate in `internal/database/database.go`
3. Add corresponding TypeScript type in `packages/shared-types/`

#### Add New Page

1. Create page component in `pages/`
2. Add route in `App.tsx`
3. Add nav item in `Sidebar.tsx` (if needed)

---

*Document generated for AI-assisted development. Last updated: 2026-02-15*
