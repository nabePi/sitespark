# Architecture Decision Record (ADR): Backend Technology Selection
## sitespark Clone - AI Website Builder Platform

**Status:** Proposed  
**Date:** 2026-02-09  
**Deciders:** Ogii (AI Architect)  
**Consulted:** Mas Way (Product Owner)  

---

## 1. CONTEXT

### 1.1 Problem Statement
Memilih backend technology untuk sitespark clone - platform AI-powered website builder dengan requirements:
- AI chat-to-website generation (Kimi K2.5 API)
- Real-time chat interface (WebSocket)
- Token economy system
- Website generation pipeline
- File storage & deployment
- 1,000+ websites/month target

### 1.2 Constraints
- AI API: Kimi Code API (https://api.kimi.com/coding/)
- Frontend: React + TypeScript
- Database: PostgreSQL
- Deployment: Docker + VPS
- Timeline: MVP dalam 2-3 jam development

---

## 2. OPTIONS CONSIDERED

### Option A: Node.js (Express + TypeScript)
**Profile:** JavaScript runtime dengan event-driven I/O

**Pros:**
- ✅ Mature AI SDK ecosystem (OpenAI, Anthropic official SDKs)
- ✅ Same language dengan frontend (TypeScript full-stack)
- ✅ Socket.io native untuk real-time chat
- ✅ JSON manipulation sangat efisien
- ✅ Development velocity tinggi (no compile)
- ✅ Community besar, resources melimpah

**Cons:**
- ❌ Single-threaded (CPU-intensive tasks blocking)
- ❌ Memory footprint tinggi (~100MB per instance)
- ❌ Callback hell/async complexity
- ❌ Type safety runtime (not compile-time)

**Cost Analysis:**
```
Server: 2 vCPU, 4GB RAM
Instance: $40-60/month
Scale: Horizontal dengan PM2/Cluster
```

---

### Option B: Go (Gin/Fiber)
**Profile:** Statically-typed, compiled language dengan goroutines

**Pros:**
- ✅ Performance 10x lebih cepat (50K vs 5K req/s)
- ✅ Memory efficient (10MB vs 100MB per instance)
- ✅ Concurrency native (goroutines, channels)
- ✅ Static binary deployment (1 file executable)
- ✅ Type safety compile-time
- ✅ Built-in testing & profiling

**Cons:**
- ❌ AI SDK ecosystem kurang mature (community-driven)
- ❌ JSON manipulation lebih verbose
- ❌ Development speed lebih lambat (compile cycle)
- ❌ Real-time setup lebih complex (Gorilla WebSocket)
- ❌ Learning curve untuk team JS

**Cost Analysis:**
```
Server: 1 vCPU, 2GB RAM (sufficient)
Instance: $20-30/month (50% cheaper)
Scale: Vertical lebih efektif
```

---

### Option C: Python (FastAPI)
**Profile:** Dynamic language dengan async framework

**Pros:**
- ✅ AI ecosystem paling mature (LangChain, LlamaIndex)
- ✅ FastAPI async performance bagus
- ✅ Data science libraries lengkap
- ✅ Rapid prototyping

**Cons:**
- ❌ GIL (Global Interpreter Lock) - true parallelism terbatas
- ❌ Type hints optional (runtime errors)
- ❌ Memory usage tinggi
- ❌ Frontend harus beda language
- ❌ Deployment lebih complex

**Cost Analysis:**
```
Server: 2 vCPU, 4GB RAM
Instance: $40-60/month
Scale: Horizontal dengan Gunicorn
```

---

### Option D: Hybrid Architecture
**Profile:** Microservices dengan specialized services

**Architecture:**
```
AI Service (Node.js/Python)  ← AI SDKs mature
    ↓ gRPC/HTTP
Core API (Go)                ← Business logic, performance
    ↓
Frontend (React)
```

**Pros:**
- ✅ Best of both worlds
- ✅ AI SDKs mature di dedicated service
- ✅ Core API high performance
- ✅ Independent scaling

**Cons:**
- ❌ Complexity tinggi (multiple services)
- ❌ Network latency antara services
- ❌ Deployment lebih complex
- ❌ Overkill untuk MVP

---

## 3. DECISION CRITERIA

| Criteria | Weight | Node.js | Go | Python | Hybrid |
|----------|--------|---------|-----|--------|--------|
| **AI Integration** | 25% | 10 | 6 | 10 | 9 |
| **Real-time Chat** | 20% | 10 | 7 | 8 | 8 |
| **Performance** | 15% | 6 | 10 | 7 | 9 |
| **Dev Velocity** | 15% | 10 | 6 | 8 | 5 |
| **Memory Efficiency** | 10% | 5 | 10 | 5 | 7 |
| **Type Safety** | 10% | 6 | 10 | 7 | 8 |
| **Deployment Simplicity** | 5% | 9 | 8 | 7 | 4 |
| **TOTAL** | 100% | **8.35** | **7.55** | **7.75** | **7.55** |

---

## 4. DECISION

**Chosen Option: NODE.JS (Express + TypeScript)**

### 4.1 Justification

Meskipun Go memiliki score teknis lebih tinggi untuk performance dan type safety, **Node.js dipilih** karena:

1. **AI Integration Critical (25% weight)**
   - Kimi Code API integration lebih straightforward
   - Streaming response handling lebih mature
   - Error handling & retry logic well-documented

2. **Development Velocity (MVP Focus)**
   - Timeline 2-3 jam development realistic dengan Node.js
   - Go membutuhkan 3-4 jam (boilerplate, compile cycles)
   - Python 2.5-3.5 jam (type system kurang strict)

3. **Full-Stack TypeScript Synergy**
   - Shared types antara frontend & backend
   - Developer productivity tinggi
   - Single language untuk entire team

4. **Real-time Chat Native**
   - Socket.io ecosystem mature
   - Event-driven architecture natural fit
   - Room management, broadcasting built-in

5. **JSON-Heavy Operations**
   - Website config = complex nested JSON
   - JavaScript V8 engine optimized untuk ini
   - Go requires struct definitions (verbose)

### 4.2 Trade-offs Accepted

| Trade-off | Mitigation |
|-----------|------------|
| Performance (5K vs 50K req/s) | Caching, horizontal scaling dengan PM2 |
| Memory usage (100MB) | 4GB RAM sufficient untuk 1,000 websites/month |
| Single-threaded | Cluster mode, non-blocking I/O untuk AI calls |
| Runtime type errors | Strict TypeScript, Zod validation |

---

## 5. IMPLEMENTATION APPROACH

### 5.1 Tech Stack Detail

```
Runtime: Node.js 20 LTS
Framework: Express.js 4.x
Language: TypeScript 5.x
ORM: Prisma 5.x
Validation: Zod 3.x
Real-time: Socket.io 4.x
AI Client: Native fetch (Kimi Code API)
```

### 5.2 Architecture Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
│  React + Vite + Tailwind CSS + Socket.io-client             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY                               │
│  Express.js + Middleware (Auth, Rate Limit, Validation)     │
│  Routes: /api/auth, /api/ai, /api/websites, /api/tokens     │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼───────┐  ┌────────▼────────┐  ┌──────▼──────┐
│   AI Service  │  │ Website Pipeline │  │ Token Eco   │
│  (Kimi API)   │  │ (Generate/Deploy)│  │ (Balance)   │
└───────────────┘  └─────────────────┘  └─────────────┘
        │                   │                   │
        └───────────────────┴───────────────────┘
                            │
                    ┌───────▼───────┐
                    │  PostgreSQL   │
                    │    + Prisma   │
                    └───────────────┘
```

### 5.3 Performance Optimization Strategy

```typescript
// 1. AI Response Caching (Redis)
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// 2. Connection Pooling
// Prisma default connection pool: optimal

// 3. Cluster Mode (PM2)
// 4 instances untuk utilize 4 CPU cores

// 4. Streaming Response
// AI responses streamed ke client (reduce memory)
```

### 5.4 Cost Projection

| Component | Spec | Monthly Cost |
|-----------|------|--------------|
| VPS (Node.js) | 4 vCPU, 8GB RAM | $40-60 |
| PostgreSQL | Managed/Container | $20-30 |
| Redis | Container | $10-15 |
| AI (Kimi K2.5) | 1,000 websites | $3-5 |
| **TOTAL** | | **$73-110** |

---

## 6. ALTERNATIVES CONSIDERED FOR FUTURE

### 6.1 Migration Path ke Go

**Trigger:**
- Scale > 10,000 websites/month
- Latency requirements < 50ms p95
- Team size > 5 developers

**Approach:**
1. Extract AI Service ke dedicated Go microservice
2. Keep Node.js untuk real-time (Socket.io)
3. API Gateway route ke appropriate service

### 6.2 Python untuk AI Pipeline

**Trigger:**
- Butuh complex ML models (custom fine-tuning)
- Integrasi dengan LangChain ecosystem

**Approach:**
1. Python service untuk AI pipeline complex
2. Node.js API Gateway tetap
3. gRPC communication

---

## 7. CONSEQUENCES

### 7.1 Positive
- ✅ Rapid MVP development (2-3 jam)
- ✅ Full-stack TypeScript = productivity
- ✅ Mature ecosystem, debugging tools
- ✅ Easy hiring (JavaScript developers abundant)

### 7.2 Negative
- ⚠️ Performance ceiling lebih rendah dari Go
- ⚠️ Memory usage lebih tinggi
- ⚠️ Runtime type errors possible (mitigated dengan Zod)

### 7.3 Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| AI SDK compatibility | Low | High | Test Kimi API integration early |
| Performance bottleneck | Medium | Medium | Implement caching, monitoring |
| Memory leaks | Low | Medium | Use clinic.js, proper cleanup |

---

## 8. NOTES

### 8.1 Kimi Code API Integration

```typescript
// services/kimi.service.ts
interface KimiConfig {
  baseURL: 'https://api.kimi.com/coding';
  apiKey: string;  // km-xxx
  model: 'kimi-k2-5';
  maxTokens: 4000;
  temperature: 0.7;
}

// Native fetch implementation (no SDK needed)
const response = await fetch(`${config.baseURL}/v1/chat/completions`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${config.apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: config.model,
    messages: [...],
    stream: true,  // Streaming support
  }),
});
```

### 8.2 Why NOT Go for This Specific Project

Meskipun Go technically superior:
1. **MVP Timeline:** 2-3 jam tidak cukup untuk Go boilerplate
2. **AI Integration:** Kimi API via HTTP, tidak ada official Go SDK
3. **Team Context:** Assumed JavaScript/TypeScript expertise
4. **Scale:** 1,000 websites/month = Node.js sufficient

**Go lebih cocok untuk:**
- Scale > 10K websites/month
- Latency-sensitive applications
- Systems programming
- Team dengan Go expertise

---

## 9. REFERENCES

- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/)
- [Express.js Documentation](https://expressjs.com/)
- [Prisma with TypeScript](https://www.prisma.io/docs/)
- [Socket.io Performance](https://socket.io/docs/v4/)
- [Kimi Code API Documentation](https://api.kimi.com/coding/)

---

**Decision Date:** 2026-02-09  
**Decision Maker:** Ogii (AI Architect)  
**Status:** APPROVED ✅

*This ADR will be reviewed when monthly active users exceed 10,000 or latency requirements change.*
