# Tapsite.ai Clone - Implementation Plan

> **Project**: AI-Powered Website Builder SaaS  
> **Stack**: Node.js/Express + TypeScript | React + Vite + Tailwind CSS | PostgreSQL + Prisma  
> **Created**: 2025-02-09  

---

## Table of Contents

1. [Design System Guidelines](#1-design-system-guidelines)
2. [Tech Stack Specification](#2-tech-stack-specification)
3. [File Structure](#3-file-structure)
4. [Backend Implementation](#4-backend-implementation)
5. [Frontend Implementation](#5-frontend-implementation)
6. [Database Schema](#6-database-schema)
7. [AI Prompts](#7-ai-prompts)
8. [DevOps Setup](#8-devops-setup)
9. [Dependencies List](#9-dependencies-list)
10. [Implementation Order & Priorities](#10-implementation-order--priorities)

---

## 1. Design System Guidelines

### Design Pattern: Minimal Single Column
- **Conversion Focus**: Single CTA focus, large typography, lots of whitespace, no nav clutter
- **Mobile-first approach**
- **Layout**: Center-aligned, large CTA button
- **Sections**: Hero headline → Short description → Benefit bullets (max 3) → CTA → Footer

### Visual Style: Glassmorphism
- **Keywords**: Frosted glass, transparent, blurred background, layered, vibrant background, light source, depth, multi-layer
- **Best For**: Modern SaaS, financial dashboards, high-end corporate, lifestyle apps, modal overlays
- **Performance**: ⚠️ Good | **Accessibility**: ⚠️ Ensure 4.5:1 contrast

### Color Palette
```
Primary:    #2563EB (Trust Blue)
Secondary:  #3B82F6
CTA:        #F97316 (Accent Orange)
Background: #F8FAFC
Text:       #1E293B
Notes:      Trust blue + accent contrast
```

### Typography
- **Font Family**: Plus Jakarta Sans (Google Fonts)
- **Mood**: Friendly, modern, SaaS, clean, approachable, professional
- **Best For**: SaaS products, web apps, dashboards, B2B, productivity tools
- **CSS Import**:
```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
```

### Key Effects
- Backdrop blur (10-20px)
- Subtle border (1px solid rgba white 0.2)
- Light reflection
- Z-depth layering

### Anti-patterns to AVOID
- Excessive animation
- Dark mode by default

### Pre-Delivery Checklist
- [ ] No emojis as icons (use SVG: Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive breakpoints: 375px, 768px, 1024px, 1440px

---

## 2. Tech Stack Specification

### Backend
| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Node.js | 20.x LTS |
| Framework | Express.js | 4.x |
| Language | TypeScript | 5.x |
| ORM | Prisma | 5.x |
| Database | PostgreSQL | 15+ |
| Cache | Redis | 7.x |
| Auth | JWT (jsonwebtoken) | 9.x |
| Password Hash | bcrypt | 5.x |
| Validation | Zod | 3.x |
| AI SDKs | OpenAI, Anthropic, Google Generative AI | Latest |
| Image Gen | OpenAI DALL-E, Stability AI | Latest |
| Real-time | Socket.io | 4.x |
| Queue | BullMQ (Redis-based) | 4.x |
| Storage | AWS S3 / MinIO | - |

### Frontend
| Component | Technology | Version |
|-----------|------------|---------|
| Build Tool | Vite | 5.x |
| Framework | React | 18.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.4+ |
| UI Components | shadcn/ui | Latest |
| Icons | Lucide React | Latest |
| State | Zustand | 4.x |
| Forms | React Hook Form | 7.x |
| Validation | Zod | 3.x |
| HTTP Client | Axios | 1.x |
| Real-time | Socket.io-client | 4.x |
| Animation | Framer Motion | 11.x |
| Font | Plus Jakarta Sans | - |

### DevOps
| Component | Technology |
|-----------|------------|
| Container | Docker |
| Orchestration | Docker Compose |
| Reverse Proxy | Nginx |
| CI/CD | GitHub Actions |
| Hosting | VPS / AWS / DigitalOcean |

---

## 3. File Structure

```
tapsite-clone/
├── docker-compose.yml
├── .env.example
├── README.md
│
├── apps/
│   ├── backend/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── .env.example
│   │   │
│   │   ├── src/
│   │   │   ├── index.ts                 # Entry point
│   │   │   ├── config/
│   │   │   │   ├── database.ts          # Prisma client
│   │   │   │   ├── redis.ts             # Redis client
│   │   │   │   ├── env.ts               # Environment validation
│   │   │   │   └── cors.ts              # CORS config
│   │   │   │
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts              # JWT middleware
│   │   │   │   ├── errorHandler.ts      # Global error handler
│   │   │   │   ├── rateLimiter.ts       # Rate limiting
│   │   │   │   └── validateRequest.ts   # Zod validation
│   │   │   │
│   │   │   ├── routes/
│   │   │   │   ├── index.ts             # Route aggregator
│   │   │   │   ├── auth.routes.ts       # Auth endpoints
│   │   │   │   ├── user.routes.ts       # User endpoints
│   │   │   │   ├── website.routes.ts    # Website CRUD
│   │   │   │   ├── ai.routes.ts         # AI generation
│   │   │   │   ├── token.routes.ts      # Token economy
│   │   │   │   ├── blog.routes.ts       # Blog CMS
│   │   │   │   ├── form.routes.ts       # Form builder
│   │   │   │   └── analytics.routes.ts  # Analytics
│   │   │   │
│   │   │   ├── controllers/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── user.controller.ts
│   │   │   │   ├── website.controller.ts
│   │   │   │   ├── ai.controller.ts
│   │   │   │   ├── token.controller.ts
│   │   │   │   ├── blog.controller.ts
│   │   │   │   ├── form.controller.ts
│   │   │   │   └── analytics.controller.ts
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── ai/
│   │   │   │   │   ├── openai.service.ts
│   │   │   │   │   ├── claude.service.ts
│   │   │   │   │   ├── gemini.service.ts
│   │   │   │   │   ├── imageGen.service.ts
│   │   │   │   │   └── aiRouter.service.ts
│   │   │   │   │
│   │   │   │   ├── website/
│   │   │   │   │   ├── intentParser.service.ts
│   │   │   │   │   ├── designGenerator.service.ts
│   │   │   │   │   ├── contentGenerator.service.ts
│   │   │   │   │   ├── deployer.service.ts
│   │   │   │   │   └── websitePipeline.service.ts
│   │   │   │   │
│   │   │   │   ├── token/
│   │   │   │   │   ├── tokenManager.service.ts
│   │   │   │   │   ├── transaction.service.ts
│   │   │   │   │   └── pricing.service.ts
│   │   │   │   │
│   │   │   │   └── storage/
│   │   │   │       ├── s3.service.ts
│   │   │   │       └── localStorage.service.ts
│   │   │   │
│   │   │   ├── models/
│   │   │   │   └── types/
│   │   │   │       ├── user.types.ts
│   │   │   │       ├── website.types.ts
│   │   │   │       ├── ai.types.ts
│   │   │   │       └── token.types.ts
│   │   │   │
│   │   │   ├── utils/
│   │   │   │   ├── logger.ts
│   │   │   │   ├── hash.ts
│   │   │   │   ├── jwt.ts
│   │   │   │   └── validators.ts
│   │   │   │
│   │   │   ├── jobs/
│   │   │   │   ├── websiteGeneration.queue.ts
│   │   │   │   └── email.queue.ts
│   │   │   │
│   │   │   └── prompts/
│   │   │       ├── intentParser.prompt.ts
│   │   │       ├── contentGenerator.prompt.ts
│   │   │       ├── designDecision.prompt.ts
│   │   │       └── systemPrompts.ts
│   │   │
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       ├── migrations/
│   │       └── seed.ts
│   │
│   └── frontend/
│       ├── Dockerfile
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       ├── postcss.config.js
│       ├── index.html
│       │
│       ├── public/
│       │   └── fonts/
│       │
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── index.css
│       │   │
│       │   ├── components/
│       │   │   ├── ui/                    # shadcn/ui components
│       │   │   │   ├── button.tsx
│       │   │   │   ├── card.tsx
│       │   │   │   ├── input.tsx
│       │   │   │   ├── dialog.tsx
│       │   │   │   └── ...
│       │   │   │
│       │   │   ├── layout/
│       │   │   │   ├── RootLayout.tsx
│       │   │   │   ├── DashboardLayout.tsx
│       │   │   │   ├── Sidebar.tsx
│       │   │   │   ├── Header.tsx
│       │   │   │   └── Footer.tsx
│       │   │   │
│       │   │   ├── landing/
│       │   │   │   ├── Hero.tsx
│       │   │   │   ├── Features.tsx
│       │   │   │   ├── HowItWorks.tsx
│       │   │   │   ├── Pricing.tsx
│       │   │   │   ├── Testimonials.tsx
│       │   │   │   └── CTA.tsx
│       │   │   │
│       │   │   ├── chat/
│       │   │   │   ├── ChatInterface.tsx
│       │   │   │   ├── MessageBubble.tsx
│       │   │   │   ├── ChatInput.tsx
│       │   │   │   └── TypingIndicator.tsx
│       │   │   │
│       │   │   ├── website/
│       │   │   │   ├── WebsitePreview.tsx
│       │   │   │   ├── WebsiteBuilder.tsx
│       │   │   │   ├── SectionEditor.tsx
│       │   │   │   └── ComponentPalette.tsx
│       │   │   │
│       │   │   ├── blog/
│       │   │   │   ├── BlogEditor.tsx
│       │   │   │   ├── BlogList.tsx
│       │   │   │   └── BlogCard.tsx
│       │   │   │
│       │   │   ├── form/
│       │   │   │   ├── FormBuilder.tsx
│       │   │   │   ├── FieldTypes.tsx
│       │   │   │   └── FormPreview.tsx
│       │   │   │
│       │   │   └── token/
│       │   │       ├── TokenWallet.tsx
│       │   │       ├── TransactionHistory.tsx
│       │   │       └── TokenPurchase.tsx
│       │   │
│       │   ├── pages/
│       │   │   ├── LandingPage.tsx
│       │   │   ├── LoginPage.tsx
│       │   │   ├── RegisterPage.tsx
│       │   │   ├── DashboardPage.tsx
│       │   │   ├── ChatPage.tsx
│       │   │   ├── WebsiteBuilderPage.tsx
│       │   │   ├── BlogPage.tsx
│       │   │   ├── FormBuilderPage.tsx
│       │   │   ├── TokenWalletPage.tsx
│       │   │   └── SettingsPage.tsx
│       │   │
│       │   ├── hooks/
│       │   │   ├── useAuth.ts
│       │   │   ├── useUser.ts
│       │   │   ├── useWebsite.ts
│       │   │   ├── useChat.ts
│       │   │   ├── useToken.ts
│       │   │   └── useSocket.ts
│       │   │
│       │   ├── stores/
│       │   │   ├── authStore.ts
│       │   │   ├── websiteStore.ts
│       │   │   ├── chatStore.ts
│       │   │   └── tokenStore.ts
│       │   │
│       │   ├── lib/
│       │   │   ├── api.ts                 # Axios instance
│       │   │   ├── socket.ts              # Socket.io client
│       │   │   ├── utils.ts
│       │   │   └── constants.ts
│       │   │
│       │   ├── types/
│       │   │   ├── user.ts
│       │   │   ├── website.ts
│       │   │   ├── ai.ts
│       │   │   ├── token.ts
│       │   │   └── form.ts
│       │   │
│       │   └── styles/
│       │       └── globals.css
│       │
│       └── .env.example
│
├── packages/
│   └── shared-types/                      # Shared TypeScript types
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── user.ts
│           ├── website.ts
│           ├── ai.ts
│           ├── token.ts
│           └── index.ts
│
└── scripts/
    ├── setup.sh                           # Initial setup script
    ├── dev-start.sh                       # Start dev environment
    └── deploy.sh                          # Deployment script
```

---

## 4. Backend Implementation

### 4.1 Project Setup
**Priority: P0 | Est: 2-3 hours**

```bash
# Initialize project
mkdir -p apps/backend && cd apps/backend
npm init -y

# Install core dependencies
npm install express cors helmet morgan dotenv
npm install -D typescript @types/node @types/express @types/cors ts-node-dev

# Initialize TypeScript
npx tsc --init
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 4.2 Database Setup (Prisma + PostgreSQL)
**Priority: P0 | Est: 4-5 hours**

See Section 6 for complete schema.

```bash
# Install Prisma
npm install prisma @prisma/client
npx prisma init

# Run migrations
npx prisma migrate dev --name init
npx prisma generate

# Seed data
npx prisma db seed
```

### 4.3 Authentication (JWT + bcrypt)
**Priority: P0 | Est: 4-5 hours**

**Features:**
- User registration with email/password
- Login with JWT access + refresh tokens
- Password reset via email
- Email verification
- OAuth (Google, GitHub)

**Key Files:**
- `src/middleware/auth.ts` - JWT verification middleware
- `src/controllers/auth.controller.ts` - Auth endpoints
- `src/utils/jwt.ts` - Token generation/verification
- `src/utils/hash.ts` - Password hashing

### 4.4 AI Service Layer
**Priority: P0 | Est: 8-10 hours**

```bash
npm install openai @anthropic-ai/sdk @google/generative-ai
```

**Architecture:**
```
services/ai/
├── baseAIService.ts          # Abstract base class
├── openai.service.ts         # OpenAI integration
├── claude.service.ts         # Anthropic Claude integration
├── gemini.service.ts         # Google Gemini integration
├── imageGen.service.ts       # DALL-E & Stability AI
└── aiRouter.service.ts       # Load balancing & fallback
```

**Features:**
- Multi-provider AI with automatic fallback
- Token usage tracking
- Response caching
- Rate limiting per user
- Streaming responses

### 4.5 Image Generation Service
**Priority: P1 | Est: 4-5 hours**

**Providers:**
- OpenAI DALL-E 3 (primary)
- Stability AI (fallback)

**Features:**
- Image generation from prompts
- Style presets (modern, minimal, corporate, creative)
- Image storage to S3
- Thumbnail generation
- CDN integration

### 4.6 Token Economy System
**Priority: P0 | Est: 6-7 hours**

**Features:**
- Token balance management
- Transaction history
- Pricing tiers
- Purchase flow (Stripe integration)
- Usage-based billing
- Token consumption tracking per AI call

**Tables:**
- `tokens` - User token balances
- `transactions` - Credit/debit transactions
- `pricing_plans` - Subscription tiers

### 4.7 Website Generation Pipeline
**Priority: P0 | Est: 12-15 hours**

**Pipeline Stages:**

```
User Intent (chat) 
  ↓
[Intent Parser] → Structured requirements
  ↓
[Design Generator] → Design system + layout
  ↓
[Content Generator] → Copy, images, sections
  ↓
[Code Generator] → React components + Tailwind
  ↓
[Deployer] → Static build + CDN upload
  ↓
Live Website URL
```

**Services:**
- `intentParser.service.ts` - Extract website requirements from chat
- `designGenerator.service.ts` - Generate design decisions
- `contentGenerator.service.ts` - Generate copy and structure
- `deployer.service.ts` - Build and deploy website
- `websitePipeline.service.ts` - Orchestrate the full pipeline

### 4.8 Form Submission Handler
**Priority: P1 | Est: 3-4 hours**

**Features:**
- Dynamic form endpoints
- Submission validation
- Email notifications
- Webhook integrations
- Export to CSV
- Spam filtering

### 4.9 Analytics Tracking
**Priority: P2 | Est: 4-5 hours**

**Features:**
- Page view tracking
- Event tracking (clicks, scroll, engagement)
- Unique visitor counting
- Geographic data
- Device/browser stats
- Dashboard with charts

### 4.10 API Routes (RESTful)
**Priority: P0 | Est: 6-8 hours**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | User registration |
| `/api/auth/login` | POST | User login |
| `/api/auth/logout` | POST | User logout |
| `/api/auth/refresh` | POST | Refresh access token |
| `/api/auth/forgot-password` | POST | Request password reset |
| `/api/auth/reset-password` | POST | Reset password |
| `/api/user/me` | GET | Get current user |
| `/api/user/me` | PUT | Update user profile |
| `/api/websites` | GET | List user websites |
| `/api/websites` | POST | Create new website |
| `/api/websites/:id` | GET | Get website details |
| `/api/websites/:id` | PUT | Update website |
| `/api/websites/:id` | DELETE | Delete website |
| `/api/websites/:id/publish` | POST | Publish website |
| `/api/websites/:id/export` | GET | Export website code |
| `/api/chat` | POST | Send message to AI |
| `/api/chat/stream` | WS | Real-time chat stream |
| `/api/tokens/balance` | GET | Get token balance |
| `/api/tokens/history` | GET | Get transaction history |
| `/api/tokens/purchase` | POST | Purchase tokens |
| `/api/blog` | GET | List blog posts |
| `/api/blog` | POST | Create blog post |
| `/api/blog/:id` | GET/PUT/DELETE | Blog CRUD |
| `/api/forms` | GET/POST | Form builder CRUD |
| `/api/forms/:id/submit` | POST | Submit form |
| `/api/forms/:id/submissions` | GET | Get submissions |
| `/api/analytics/:websiteId` | GET | Get analytics |

---

## 5. Frontend Implementation

### 5.1 Project Setup (Vite + React + TypeScript + Tailwind)
**Priority: P0 | Est: 2-3 hours**

```bash
# Create Vite project
npm create vite@latest apps/frontend -- --template react-ts

# Install Tailwind CSS
cd apps/frontend
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install core dependencies
npm install axios zustand react-router-dom @tanstack/react-query
npm install lucide-react framer-motion clsx tailwind-merge
npm install react-hook-form @hookform/resolvers zod
npm install socket.io-client
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install class-variance-authority
```

**tailwind.config.js:**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        cta: {
          DEFAULT: '#F97316',
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
        },
        background: '#F8FAFC',
        foreground: '#1E293B',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### 5.2 Design System Setup
**Priority: P0 | Est: 4-5 hours**

**shadcn/ui Components:**
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input dialog dropdown-menu
npx shadcn-ui@latest add textarea select tabs avatar badge
npx shadcn-ui@latest add toast skeleton tooltip
```

**Custom Components:**
- `GlassCard` - Card with glassmorphism effect
- `GradientText` - Text with gradient effect
- `AnimatedButton` - Button with hover animations
- `ChatBubble` - AI chat message bubble
- `WebsiteFrame` - Iframe wrapper for previews

### 5.3 Landing Page
**Priority: P0 | Est: 6-8 hours**

**Sections:**
1. **Hero** - Large headline, subtext, CTA button, floating preview
2. **Features** - 3 key features with icons
3. **How It Works** - 3-step process visualization
4. **Demo** - Interactive chat preview
5. **Pricing** - Token packages and subscriptions
6. **Testimonials** - User quotes with avatars
7. **CTA** - Final call-to-action
8. **Footer** - Links, social, legal

**Design:** Minimal single-column, glassmorphism cards, Plus Jakarta Sans typography

### 5.4 Authentication Pages
**Priority: P0 | Est: 4-5 hours**

**Pages:**
- `/login` - Email/password login, OAuth buttons
- `/register` - Sign up form, terms acceptance
- `/forgot-password` - Password reset request
- `/reset-password` - New password form

**Features:**
- Form validation with Zod
- Password strength indicator
- OAuth (Google, GitHub)
- Error handling with toast notifications

### 5.5 Dashboard Layout
**Priority: P0 | Est: 4-5 hours**

**Components:**
- `Sidebar` - Navigation links, collapsible on mobile
- `Header` - User menu, notifications, token balance
- `Main Content Area` - Page-specific content

**Responsive:**
- Desktop: Fixed sidebar + scrollable content
- Mobile: Hamburger menu + full-width content

### 5.6 Chat Interface
**Priority: P0 | Est: 6-8 hours**

**Features:**
- Real-time messaging with Socket.io
- Typing indicators
- Message history
- File attachments (images)
- Code syntax highlighting
- Markdown rendering
- Quick action buttons
- Website preview cards in chat

**Components:**
- `ChatInterface` - Main container
- `MessageList` - Scrollable message list
- `MessageBubble` - Individual message
- `ChatInput` - Text input with send button
- `TypingIndicator` - AI typing animation

### 5.7 Website Preview
**Priority: P0 | Est: 4-5 hours**

**Features:**
- Iframe preview of generated website
- Responsive breakpoints (mobile, tablet, desktop)
- Refresh/reload functionality
- Full-screen mode
- Device frame toggle
- Live editing sync

### 5.8 Blog CMS
**Priority: P1 | Est: 5-6 hours**

**Features:**
- Rich text editor (TipTap or Lexical)
- Draft/published states
- SEO metadata (title, description, slug)
- Featured image upload
- Categories and tags
- Scheduled publishing
- Preview mode

**Pages:**
- `/blog` - Blog post list
- `/blog/:slug` - Public blog post
- `/dashboard/blog` - CMS management
- `/dashboard/blog/new` - Create post
- `/dashboard/blog/:id/edit` - Edit post

### 5.9 Form Builder
**Priority: P1 | Est: 5-6 hours**

**Features:**
- Drag-and-drop field builder
- Field types: text, email, textarea, select, checkbox, radio, date, file
- Form preview
- Custom styling options
- Submission handling
- Export submissions
- Webhook integrations

### 5.10 Token Wallet Page
**Priority: P0 | Est: 3-4 hours**

**Features:**
- Current balance display
- Transaction history table
- Purchase tokens (Stripe integration)
- Usage breakdown by feature
- Auto-refill settings
- Token usage charts

---

## 6. Database Schema

### Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============== USERS ==============

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String?   // null for OAuth users
  name          String?
  avatar        String?
  emailVerified Boolean   @default(false)
  
  // OAuth
  googleId      String?   @unique
  githubId      String?   @unique
  
  // Relations
  websites      Website[]
  sessions      Session[]
  tokenBalance  Token?
  transactions  Transaction[]
  blogPosts     BlogPost[]
  forms         Form[]
  
  // Timestamps
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("users")
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())

  @@map("sessions")
}

// ============== WEBSITES ==============

model Website {
  id          String   @id @default(cuid())
  userId      String
  
  // Basic Info
  name        String
  description String?
  slug        String   @unique
  
  // Status
  status      WebsiteStatus @default(DRAFT)
  publishedAt DateTime?
  
  // Content
  template    String?  // template identifier
  content     Json     // website structure/components
  styles      Json     // custom styles
  
  // Deployment
  deployUrl   String?
  customDomain String?
  
  // Analytics
  analyticsId String?
  
  // Relations
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  forms       Form[]
  analytics   Analytics[]
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("websites")
}

enum WebsiteStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

// ============== TOKENS ==============

model Token {
  id        String   @id @default(cuid())
  userId    String   @unique
  
  balance   Int      @default(0)  // tokens in smallest unit
  lifetimeEarned Int @default(0)
  lifetimeUsed   Int @default(0)
  
  // Relations
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("tokens")
}

model Transaction {
  id          String          @id @default(cuid())
  userId      String
  
  // Transaction Details
  type        TransactionType
  amount      Int             // positive for credit, negative for debit
  balance     Int             // balance after transaction
  
  // Metadata
  description String?
  metadata    Json?           // AI call details, purchase info, etc.
  
  // Relations
  user        User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Timestamps
  createdAt   DateTime        @default(now())

  @@map("transactions")
}

enum TransactionType {
  PURCHASE      // Buying tokens
  USAGE         // AI generation usage
  REFUND        // Refund
  BONUS         // Welcome bonus, referral
  SUBSCRIPTION  // Monthly subscription credit
}

// ============== PRICING ==============

model PricingPlan {
  id          String   @id @default(cuid())
  
  name        String   @unique
  description String?
  
  // Pricing
  price       Decimal  @db.Decimal(10, 2)
  currency    String   @default("USD")
  interval    String?  // month, year (null for one-time)
  
  // Tokens
  tokenAmount Int      // tokens included
  
  // Features
  features    String[] // feature list for display
  
  // Stripe
  stripePriceId String?
  
  // Status
  isActive    Boolean  @default(true)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("pricing_plans")
}

// ============== BLOG ==============

model BlogPost {
  id          String        @id @default(cuid())
  authorId    String
  
  // Content
  title       String
  slug        String        @unique
  excerpt     String?
  content     String        @db.Text
  featuredImage String?
  
  // SEO
  metaTitle   String?
  metaDescription String?
  
  // Status
  status      PostStatus    @default(DRAFT)
  publishedAt DateTime?
  
  // Relations
  author      User          @relation(fields: [authorId], references: [id], onDelete: Cascade)
  
  // Timestamps
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@map("blog_posts")
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

// ============== FORMS ==============

model Form {
  id          String   @id @default(cuid())
  websiteId   String
  
  // Info
  name        String
  description String?
  
  // Configuration
  fields      Json     // form field definitions
  settings    Json     // notification settings, webhooks, etc.
  
  // Style
  styles      Json?
  
  // Relations
  website     Website  @relation(fields: [websiteId], references: [id], onDelete: Cascade)
  submissions FormSubmission[]
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("forms")
}

model FormSubmission {
  id        String   @id @default(cuid())
  formId    String
  
  // Data
  data      Json     // submitted form data
  ip        String?
  userAgent String?
  
  // Status
  isSpam    Boolean  @default(false)
  
  // Relations
  form      Form     @relation(fields: [formId], references: [id], onDelete: Cascade)
  
  // Timestamps
  createdAt DateTime @default(now())

  @@map("form_submissions")
}

// ============== ANALYTICS ==============

model Analytics {
  id          String   @id @default(cuid())
  websiteId   String
  
  // Event
  eventType   String   // pageview, click, etc.
  eventData   Json?
  
  // Visitor
  sessionId   String
  ip          String?
  userAgent   String?
  referrer    String?
  
  // Geo
  country     String?
  city        String?
  
  // Device
  device      String?
  browser     String?
  os          String?
  
  // Relations
  website     Website  @relation(fields: [websiteId], references: [id], onDelete: Cascade)
  
  // Timestamp
  createdAt   DateTime @default(now())

  @@index([websiteId, createdAt])
  @@index([sessionId])
  @@map("analytics")
}

// ============== AI GENERATIONS ==============

model AIGeneration {
  id          String   @id @default(cuid())
  userId      String
  
  // Request
  type        String   // website, image, content
  prompt      String   @db.Text
  parameters  Json?    // generation parameters
  
  // Response
  result      Json?    // generated content
  tokensUsed  Int
  
  // Provider
  provider    String   // openai, claude, gemini
  model       String
  
  // Status
  status      GenerationStatus @default(PENDING)
  error       String?
  
  // Timestamps
  createdAt   DateTime @default(now())
  completedAt DateTime?

  @@map("ai_generations")
}

enum GenerationStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

---

## 7. AI Prompts

### 7.1 Intent Parsing Prompt

```typescript
// src/prompts/intentParser.prompt.ts

export const INTENT_PARSER_PROMPT = `You are an expert web designer and developer. Parse the user's website request and extract structured requirements.

User Request: {{userMessage}}

Analyze and extract:
1. Website Purpose (business, personal, portfolio, etc.)
2. Target Audience
3. Key Features needed
4. Design Style preferences (modern, minimalist, colorful, professional)
5. Color preferences
6. Pages needed
7. Content sections required
8. Special functionality (forms, e-commerce, booking, etc.)

Respond ONLY with valid JSON in this exact format:
{
  "purpose": "string",
  "targetAudience": "string",
  "features": ["string"],
  "designStyle": "modern|minimalist|colorful|professional|creative",
  "colorScheme": {
    "primary": "hex color or 'auto'",
    "secondary": "hex color or 'auto'",
    "accent": "hex color or 'auto'"
  },
  "pages": ["home", "about", "contact", ...],
  "sections": [
    {
      "name": "hero|features|testimonials|cta|footer|...",
      "content": "brief description of content"
    }
  ],
  "specialFeatures": ["form", "booking", "ecommerce", ...],
  "tone": "professional|friendly|casual|luxury|playful"
}

If information is missing, make reasonable assumptions based on the purpose and target audience.`;
```

### 7.2 Content Generation Prompt

```typescript
// src/prompts/contentGenerator.prompt.ts

export const CONTENT_GENERATOR_PROMPT = `You are a professional copywriter. Generate compelling website content based on the requirements.

Website Requirements:
- Purpose: {{purpose}}
- Target Audience: {{targetAudience}}
- Tone: {{tone}}
- Pages: {{pages}}
- Sections: {{sections}}

Generate content for each section in markdown format. Include:
1. Headlines (attention-grabbing, benefit-focused)
2. Subheadings
3. Body copy (concise, scannable)
4. CTAs (clear action words)
5. Feature descriptions with benefits

Guidelines:
- Keep headlines under 10 words
- Use active voice
- Focus on benefits, not features
- Include power words
- Make CTAs specific and actionable
- Write for {{targetAudience}}

Respond with JSON:
{
  "pages": {
    "pageName": {
      "sections": [
        {
          "type": "hero|features|testimonials|...",
          "content": {
            "headline": "...",
            "subheadline": "...",
            "body": "...",
            "cta": "..."
          }
        }
      ]
    }
  }
}`;
```

### 7.3 Design Decision Prompt

```typescript
// src/prompts/designDecision.prompt.ts

export const DESIGN_DECISION_PROMPT = `You are a senior UI/UX designer. Create a comprehensive design system for the website.

Website Requirements:
- Purpose: {{purpose}}
- Design Style: {{designStyle}}
- Color Preferences: {{colorScheme}}
- Target Audience: {{targetAudience}}

Create a design system including:

1. COLOR PALETTE
   - Primary colors (3 shades)
   - Secondary colors (3 shades)
   - Accent color for CTAs
   - Neutral grays for text/backgrounds
   - Semantic colors (success, warning, error)

2. TYPOGRAPHY
   - Heading font (Google Font name)
   - Body font (Google Font name)
   - Font sizes for H1-H6 and body
   - Line heights

3. SPACING SYSTEM
   - Base unit (e.g., 4px, 8px)
   - Spacing scale

4. COMPONENT STYLES
   - Buttons (primary, secondary, ghost)
   - Cards
   - Inputs
   - Navigation

5. LAYOUT PRINCIPLES
   - Max container width
   - Grid system
   - Responsive breakpoints

6. EFFECTS
   - Border radius values
   - Shadow styles
   - Animation timings

Respond with valid JSON matching this structure:
{
  "colors": {
    "primary": { "50": "...", "500": "...", "600": "..." },
    "secondary": { "50": "...", "500": "...", "600": "..." },
    "accent": "...",
    "neutral": { "50": "...", "900": "..." },
    "semantic": { "success": "...", "warning": "...", "error": "..." }
  },
  "typography": {
    "headingFont": "Plus Jakarta Sans",
    "bodyFont": "Plus Jakarta Sans",
    "sizes": { "h1": "3rem", "h2": "2.25rem", ... }
  },
  "spacing": { "base": "0.25rem", "scale": ["0.25rem", "0.5rem", ...] },
  "components": {
    "buttons": { "borderRadius": "0.5rem", ... },
    "cards": { ... }
  },
  "layout": { "maxWidth": "1280px", "gridColumns": 12 },
  "effects": { "borderRadius": { "sm": "0.25rem", ... } }
}`;
```

### 7.4 System Prompts

```typescript
// src/prompts/systemPrompts.ts

export const WEBSITE_GENERATOR_SYSTEM = `You are Tapsite AI, an expert website builder assistant.

Your role:
1. Understand user requirements through natural conversation
2. Guide users to create their ideal website
3. Generate high-quality, modern website designs
4. Provide helpful suggestions and improvements

Guidelines:
- Ask clarifying questions when needed
- Suggest modern design trends and best practices
- Keep responses concise but informative
- Always offer next steps or options
- Be encouraging and professional

When generating websites:
- Use semantic HTML
- Apply responsive design principles
- Ensure accessibility standards
- Optimize for performance
- Include proper meta tags for SEO`;

export const CODE_GENERATOR_SYSTEM = `You are an expert React and Tailwind CSS developer.

Rules:
1. Generate valid React functional components
2. Use TypeScript for type safety
3. Apply Tailwind CSS classes for styling
4. Use semantic HTML5 elements
5. Ensure responsive design
6. Add proper accessibility attributes
7. Use Lucide React for icons

Component structure:
- Export default function ComponentName()
- Define TypeScript interfaces for props
- Use proper React hooks when needed
- Add JSDoc comments for complex logic`;
```

---

## 8. DevOps Setup

### 8.1 Docker + Docker Compose

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: tapsite-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER:-tapsite}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-secret}
      POSTGRES_DB: ${DB_NAME:-tapsite}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-tapsite}"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: tapsite-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  # Backend API
  backend:
    build:
      context: ./apps/backend
      dockerfile: Dockerfile
    container_name: tapsite-backend
    restart: unless-stopped
    environment:
      NODE_ENV: ${NODE_ENV:-development}
      PORT: 3000
      DATABASE_URL: postgresql://${DB_USER:-tapsite}:${DB_PASSWORD:-secret}@postgres:5432/${DB_NAME:-tapsite}
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      GOOGLE_AI_API_KEY: ${GOOGLE_AI_API_KEY}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
    ports:
      - "3000:3000"
    volumes:
      - ./apps/backend/src:/app/src
      - /app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: npm run dev

  # Frontend
  frontend:
    build:
      context: ./apps/frontend
      dockerfile: Dockerfile
    container_name: tapsite-frontend
    restart: unless-stopped
    environment:
      VITE_API_URL: http://localhost:3000
      VITE_WS_URL: ws://localhost:3000
    ports:
      - "5173:5173"
    volumes:
      - ./apps/frontend/src:/app/src
      - /app/node_modules
    depends_on:
      - backend
    command: npm run dev

  # Nginx (Production)
  nginx:
    image: nginx:alpine
    container_name: tapsite-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
    profiles:
      - production

volumes:
  postgres_data:
  redis_data:
```

### 8.2 Backend Dockerfile

```dockerfile
# apps/backend/Dockerfile

# Development stage
FROM node:20-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### 8.3 Frontend Dockerfile

```dockerfile
# apps/frontend/Dockerfile

# Development stage
FROM node:20-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 8.4 Environment Configuration

**.env.example (Root):**
```bash
# Environment
NODE_ENV=development

# Database
DB_USER=tapsite
DB_PASSWORD=your_secure_password
DB_NAME=tapsite
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your_jwt_secret_key_min_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=...
STABILITY_AI_API_KEY=sk-...

# Payments (Stripe)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Storage (AWS S3 or MinIO)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=tapsite-assets
S3_ENDPOINT= # For MinIO

# Email (SendGrid/AWS SES)
EMAIL_PROVIDER=sendgrid
EMAIL_API_KEY=...
EMAIL_FROM=noreply@tapsite.ai

# Frontend
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
```

---

## 9. Dependencies List

### Backend Dependencies

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.17.0",
    "@google/generative-ai": "^0.2.0",
    "@prisma/client": "^5.9.0",
    "bullmq": "^5.1.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.0",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "ioredis": "^5.3.2",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "multer": "^1.4.5-lts.1",
    "openai": "^4.26.0",
    "passport": "^0.7.0",
    "passport-github2": "^0.1.12",
    "passport-google-oauth20": "^2.0.0",
    "socket.io": "^4.7.4",
    "stripe": "^14.14.0",
    "uuid": "^9.0.1",
    "winston": "^3.11.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/morgan": "^1.9.9",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.11.5",
    "@types/passport": "^1.0.16",
    "@types/passport-github2": "^1.2.9",
    "@types/passport-google-oauth20": "^2.0.14",
    "@types/uuid": "^9.0.7",
    "bcrypt": "^5.1.1",
    "prisma": "^5.9.0",
    "ts-node": "^10.9.2",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.3.3"
  }
}
```

### Frontend Dependencies

```json
{
  "dependencies": {
    "@hookform/resolvers": "^3.3.4",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-tooltip": "^1.0.7",
    "@tanstack/react-query": "^5.17.19",
    "axios": "^1.6.5",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "framer-motion": "^11.0.3",
    "lucide-react": "^0.312.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.49.3",
    "react-router-dom": "^6.21.3",
    "socket.io-client": "^4.7.4",
    "tailwind-merge": "^2.2.0",
    "zod": "^3.22.4",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.5",
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "eslint": "^8.56.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.33",
    "tailwindcss": "^3.4.1",
    "tailwindcss-animate": "^1.0.7",
    "typescript": "^5.3.3",
    "vite": "^5.0.11"
  }
}
```

---

## 10. Implementation Order & Priorities

### Phase 1: Foundation (Week 1-2) | P0 - Critical

| # | Task | Est. Hours | Dependencies |
|---|------|------------|--------------|
| 1 | Project setup - Backend (Express + TS) | 4 | - |
| 2 | Project setup - Frontend (Vite + React + Tailwind) | 4 | - |
| 3 | Database schema design & Prisma setup | 8 | 1 |
| 4 | User authentication (register/login/JWT) | 8 | 1, 3 |
| 5 | Frontend auth pages + protected routes | 8 | 2, 4 |
| 6 | Dashboard layout (sidebar + header) | 6 | 5 |
| 7 | Basic landing page (Hero + CTA) | 8 | 2 |

**Phase 1 Deliverable:** Working auth system + basic UI scaffold

### Phase 2: Core AI Features (Week 3-4) | P0 - Critical

| # | Task | Est. Hours | Dependencies |
|---|------|------------|--------------|
| 8 | AI service layer (OpenAI integration) | 12 | 1 |
| 9 | Chat interface (real-time messaging) | 10 | 6, 8 |
| 10 | Intent parser prompt + service | 8 | 8 |
| 11 | Basic website generation pipeline | 16 | 9, 10 |
| 12 | Website preview (iframe) | 6 | 11 |
| 13 | Token system (balance + consumption) | 10 | 3, 8 |
| 14 | Token wallet page | 6 | 6, 13 |

**Phase 2 Deliverable:** AI chat that generates websites, token system working

### Phase 3: Enhanced Features (Week 5-6) | P1 - High Priority

| # | Task | Est. Hours | Dependencies |
|---|------|------------|--------------|
| 15 | Multi-provider AI (Claude + Gemini fallback) | 8 | 8 |
| 16 | Image generation service | 8 | 8 |
| 17 | Form builder with submissions | 12 | 6 |
| 18 | Blog CMS | 10 | 6 |
| 19 | Payment integration (Stripe) | 10 | 13 |
| 20 | Complete landing page with all sections | 12 | 7 |

**Phase 3 Deliverable:** Full-featured product ready for beta

### Phase 4: Polish & Scale (Week 7-8) | P2 - Medium Priority

| # | Task | Est. Hours | Dependencies |
|---|------|------------|--------------|
| 21 | Website deployment pipeline | 10 | 11 |
| 22 | Custom domain support | 6 | 21 |
| 23 | Analytics tracking | 8 | 6 |
| 24 | Email notifications | 6 | 4 |
| 25 | Docker + production deployment | 8 | All |
| 26 | Performance optimization | 8 | All |

**Phase 4 Deliverable:** Production-ready SaaS platform

---

## Summary

### Total Estimated Effort
- **Backend**: ~80 hours
- **Frontend**: ~90 hours
- **Database/Schema**: ~20 hours
- **DevOps**: ~20 hours
- **Testing/Polish**: ~30 hours
- **Total**: ~240 hours (6 weeks with 1 full-time dev)

### Team Recommendation
- 1 Full-stack Developer (React + Node.js)
- 1 AI/Backend Specialist (Node.js + AI integrations)
- 1 UI/UX Designer (optional, can use design system)

### MVP Definition
The Minimum Viable Product includes:
- User authentication
- AI chat interface
- Basic website generation
- Token consumption system
- Website preview
- Stripe payments for tokens

---

*Document Version: 1.0*  
*Last Updated: 2025-02-09*
