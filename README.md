# SiteSpark - AI Website Builder

🚀 **Spark Your Online Presence**

AI-powered website builder that creates professional landing pages in 1 minute.

## ✨ Features

- 🤖 **AI Chat-to-Website** - Build websites via natural language chat
- ⚡ **1 Minute Generation** - Lightning fast website creation
- 💰 **Token Economy** - Pay-as-you-go pricing model
- 📊 **Form Builder** - Collect leads and data (UI only, backend planned)
- 🎨 **Glassmorphism Design** - Modern, beautiful UI
- 🔒 **JWT Authentication** - Secure user sessions
- 🌐 **Real-time Chat** - WebSocket-powered AI streaming

## 🏗️ Tech Stack

### Backend
- **Language:** Go 1.21
- **Framework:** Gin
- **Database:** PostgreSQL + GORM
- **Cache:** Redis
- **AI:** Kimi Code API (K2.5)

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **UI Library:** shadcn/ui
- **State:** Zustand

### DevOps
- **Container:** Docker
- **Orchestration:** Docker Compose
- **Deployment:** Dokploy ready

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)
- Go 1.21+ (for backend development)

### Local Development

```bash
# Clone repository
git clone https://github.com/yourusername/sitespark.git
cd sitespark

# Start with Docker Compose
docker-compose up -d

# Or manual setup

# Backend
cd apps/backend-go
cp .env.example .env
# Edit .env with your KIMI_API_KEY
go mod download
go run cmd/api/main.go

# Frontend (new terminal)
cd apps/frontend
npm install
npm run dev
```

**Access:**
- Frontend: http://localhost:3002
- API: http://localhost:3001

## 📝 Environment Variables

### Backend (.env)
```env
SERVER_PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USER=sitespark
DB_PASSWORD=your-password
DB_NAME=sitespark_db
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-jwt-secret
KIMI_API_KEY=your-kimi-api-key
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

## 🐳 Docker Deployment

```bash
# Production build
docker-compose -f docker-compose.dokploy.yml up -d
```

## 📁 Project Structure

```
sitespark/
├── apps/
│   ├── backend-go/       # Go + Gin API
│   ├── frontend/         # React + Vite SPA
│   └── docs/             # Documentation & ADR
├── packages/
│   └── shared-types/     # Shared TypeScript types
├── docker-compose.yml
├── docker-compose.dokploy.yml
└── README.md
```

## 🔧 Development

### Backend
```bash
cd apps/backend-go

# Run migrations
go run cmd/api/main.go migrate

# Start dev server
go run cmd/api/main.go

# Run tests
go test ./...
```

### Frontend
```bash
cd apps/frontend

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🚢 Deployment

### Dokploy
1. Copy `docker-compose.dokploy.yml` to Dokploy
2. Set environment variables
3. Deploy!

See [DOKPLOY_DEPLOY.md](DOKPLOY_DEPLOY.md) for detailed instructions.

## 📄 Documentation

- [PROJECT_ANALYSIS.md](PROJECT_ANALYSIS.md) - Comprehensive technical documentation (source of truth)
- [Database Schema](apps/docs/sitespark-database-schema.md) - Planned complete schema
- [Backend Rebuild Notes](apps/docs/BACKEND_REBUILD_GO.md) - Go migration history
- [API Documentation](apps/backend-go/README.md)
- [Deployment Guide](DOKPLOY_DEPLOY.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📜 License

MIT License - see [LICENSE](LICENSE) file

---

Built with ❤️ using Go, React, and AI
