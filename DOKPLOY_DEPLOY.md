# Dokploy Deployment Guide - SiteSpark.id

## Prerequisites
- Dokploy sudah terinstall (terlihat di port 3000)
- PostgreSQL dan Redis tersedia via Dokploy

## Deployment Steps

### 1. Create Project di Dokploy
1. Buka Dokploy Dashboard (http://localhost:3000)
2. Create New Project: "sitespark"
3. Pilih deployment method: Docker

### 2. Environment Variables Setup

```bash
# Database (gunakan PostgreSQL dari Dokploy)
DB_HOST=${POSTGRES_HOST}
DB_PORT=5432
DB_USER=${POSTGRES_USER}
DB_PASSWORD=${POSTGRES_PASSWORD}
DB_NAME=sitespark_db
DB_SSL_MODE=require

# Redis (gunakan Redis dari Dokploy)
REDIS_HOST=${REDIS_HOST}
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}

# Server
SERVER_PORT=3000
SERVER_ENV=production

# JWT
JWT_SECRET=your-256-bit-secret-key-here
JWT_EXPIRES=24h

# AI - Kimi Code API
KIMI_API_KEY=your-kimi-api-key
KIMI_BASE_URL=https://api.kimi.com/coding

# CORS
CORS_ORIGIN=https://your-domain.com

# Logging
LOG_LEVEL=info
```

### 3. Backend Deployment (Go)

**Dockerfile:**
```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o main ./cmd/api

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/main .
EXPOSE 3000
CMD ["./main"]
```

**Build Settings:**
- Port: 3000
- Health Check: /health
- Build Command: docker build -t sitespark-backend .

### 4. Frontend Deployment (React)

**Build Command:**
```bash
npm install && npm run build
```

**Serve dengan Nginx:**
```dockerfile
FROM nginx:alpine
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**Or use static file serving via Dokploy**

### 5. Database Setup

**Create Database:**
```sql
CREATE DATABASE sitespark_db;
CREATE USER sitespark WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE sitespark_db TO sitespark;
```

**Run Migrations:**
```bash
# Via Dokploy console atau CI/CD
cd backend-go
go run cmd/migrate/main.go
```

### 6. Domain Configuration

**Backend API:**
- Domain: api.sitespark.id (atau subdomain)
- Port: 3000
- SSL: Let's Encrypt auto

**Frontend:**
- Domain: sitespark.id
- Static files atau reverse proxy ke backend

### 7. Monitoring & Logs

Dokploy menyediakan:
- Container logs
- Resource monitoring
- Auto-restart on failure
- SSL certificate management

---

## Quick Deploy Script

```bash
#!/bin/bash
# deploy.sh

echo "Deploying SiteSpark to Dokploy..."

# 1. Build Backend
cd apps/backend-go
docker build -t sitespark-backend:latest .

# 2. Build Frontend
cd ../frontend
npm install
npm run build
docker build -t sitespark-frontend:latest .

# 3. Push to Dokploy registry (jika ada)
# docker tag sitespark-backend:latest dokploy-registry/sitespark-backend
docker push dokploy-registry/sitespark-backend

echo "Deploy complete!"
```

---

## Environment for Production

| Service | Internal URL | External URL |
|---------|-------------|--------------|
| Backend | http://backend:3000 | https://api.sitespark.id |
| Frontend | http://frontend:80 | https://sitespark.id |
| PostgreSQL | postgres:5432 | - |
| Redis | redis:6379 | - |

---

Mau saya bantu setup Dockerfile dan docker-compose yang optimized untuk Dokploy?