# TapSite Clone - Backend

AI-powered website builder backend built with Node.js, Express, TypeScript, and Prisma.

## Tech Stack

- **Runtime:** Node.js 20 LTS
- **Framework:** Express.js 4.x
- **Language:** TypeScript 5.x
- **ORM:** Prisma 5.x
- **Database:** PostgreSQL
- **AI:** Kimi Code API
- **Real-time:** Socket.io 4.x
- **Validation:** Zod 3.x
- **Auth:** JWT + bcrypt

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Kimi API Key (optional, falls back to mock data)

### Installation

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed

# Start development server
npm run dev
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/tapsite"

# Server
PORT=3001
NODE_ENV=development
API_URL=http://localhost:3001
CLIENT_URL=http://localhost:3000

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# AI - Kimi
KIMI_API_KEY=your-kimi-api-key
KIMI_API_URL=https://api.kimi.com/coding/

# Token Economy
TOKENS_SIGNUP_BONUS=100
TOKENS_DAILY_LOGIN=10
TOKENS_WEBSITE_GENERATION=50
TOKENS_CONTENT_GENERATION=10
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Websites
- `GET /api/websites` - List user websites
- `POST /api/websites` - Create website
- `POST /api/websites/generate` - Generate website with AI
- `GET /api/websites/:id` - Get website details
- `PUT /api/websites/:id` - Update website
- `DELETE /api/websites/:id` - Delete website

### Blog
- `GET /api/websites/:websiteId/blogs` - List blog posts
- `POST /api/websites/:websiteId/blogs` - Create blog post
- `GET /api/websites/:websiteId/blogs/:id` - Get blog post
- `PUT /api/websites/:websiteId/blogs/:id` - Update blog post
- `DELETE /api/websites/:websiteId/blogs/:id` - Delete blog post

### Forms
- `POST /api/forms/:websiteId/submit` - Submit form (public)
- `GET /api/forms/:websiteId/submissions` - List submissions
- `GET /api/forms/:websiteId/stats` - Get form stats

### Tokens
- `GET /api/tokens/balance` - Get token balance
- `GET /api/tokens/history` - Get transaction history
- `POST /api/tokens/add` - Add tokens (admin)

### AI
- `POST /api/ai/generate-website` - Generate website with AI
- `GET /api/ai/generate-website/stream` - Stream generation progress
- `POST /api/ai/regenerate-section/:websiteId/:sectionId` - Regenerate section

## Socket.io Events

### Client to Server
- `chat:send` - Send chat message
- `generation:start` - Start website generation
- `join:room` - Join a room
- `leave:room` - Leave a room

### Server to Client
- `chat:message` - Receive chat message
- `generation:progress` - Generation progress update
- `generation:complete` - Generation completed
- `generation:error` - Generation error

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database
- `npm run db:studio` - Open Prisma Studio
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors

## Architecture

```
src/
├── config/          # Configuration (database, env, logger)
├── controllers/     # Route handlers
├── middleware/      # Express middleware
├── models/          # Data models (if not using Prisma)
├── routes/          # API routes
├── services/        # Business logic
│   ├── ai/          # AI services (Kimi)
│   ├── token/       # Token economy
│   └── website/     # Website generation
├── socket/          # Socket.io handlers
├── types/           # TypeScript types
└── utils/           # Utility functions
```

## License

MIT