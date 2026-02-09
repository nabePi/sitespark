# SiteSpark Backend (Go)

Clean Go implementation of the SiteSpark backend using Gin framework.

## Tech Stack

- **Language:** Go 1.21
- **Framework:** Gin (github.com/gin-gonic/gin)
- **Database:** PostgreSQL + GORM (gorm.io/gorm)
- **Cache:** Redis (github.com/redis/go-redis)
- **Auth:** JWT (github.com/golang-jwt/jwt/v5)
- **Validation:** github.com/go-playground/validator/v10
- **Config:** github.com/spf13/viper
- **Logger:** github.com/sirupsen/logrus

## Environment Variables

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
DB_SSLMODE=disable

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Kimi AI API
KIMI_API_KEY=your-kimi-api-key
KIMI_BASE_URL=https://api.moonshot.cn/v1
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user

### User
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile

### Website
- `GET /api/websites` - List user websites
- `GET /api/websites/:id` - Get website by ID
- `POST /api/websites` - Create new website
- `PUT /api/websites/:id` - Update website
- `DELETE /api/websites/:id` - Delete website

### AI
- `POST /api/ai/generate` - Generate website with AI (50 tokens)
- `POST /api/ai/chat` - Chat with AI assistant

### Token Economy
- `GET /api/tokens/balance` - Get token balance
- `GET /api/tokens/transactions` - Get transaction history
- `POST /api/tokens/daily` - Claim daily login bonus (10 tokens)

## Running Locally

```bash
# Install dependencies
go mod download

# Run the server
go run cmd/api/main.go

# Or build and run
go build -o main cmd/api/main.go
./main
```

## Running with Docker

```bash
# Build image
docker build -t sitespark-backend .

# Run container
docker run -p 3001:3001 --env-file .env sitespark-backend
```

## Database Setup

```bash
# Create database
createdb sitespark

# Run migrations (auto-run on startup)
```

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": {...}
}
```

Or for errors:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

## Project Structure

```
backend-go/
├── cmd/
│   └── api/
│       └── main.go              # Entry point
├── internal/
│   ├── config/                  # Configuration
│   ├── database/                # Database connection
│   ├── models/                  # GORM models
│   ├── handlers/                # HTTP handlers
│   ├── middleware/              # Gin middleware
│   ├── services/                # Business logic
│   │   ├── ai/                  # Kimi API client
│   │   ├── website/             # Website generation
│   │   └── token/               # Token economy
│   └── utils/                   # Utilities
├── go.mod
├── go.sum
├── Dockerfile
└── README.md
```
