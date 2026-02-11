# WebSocket vs Socket.io: Deep Dive Comparison for SiteSpark

## Executive Summary

For **SiteSpark's Go backend + React frontend** use case (AI chat streaming), **Native WebSocket with Gorilla** is the recommended approach. It provides lower latency, simpler maintenance, and better scalability for our specific needs, while Socket.io adds unnecessary overhead when WebSocket fallback isn't critical.

---

## 1. Protocol Architecture

### Native WebSocket (RFC 6455)
```
┌─────────────────────────────────────────────────────────────┐
│                    WebSocket Protocol                       │
├─────────────────────────────────────────────────────────────┤
│  Handshake: HTTP/1.1 Upgrade → 101 Switching Protocols     │
│  Frame Format: 2-14 byte header + payload                  │
│  Message Types: Text (0x1), Binary (0x2), Close (0x8)      │
│  Ping/Pong: Protocol-level keepalive (handled by browser)  │
│  Compression: permessage-deflate (optional)                │
└─────────────────────────────────────────────────────────────┘
```

**Key Characteristics:**
- Direct TCP connection after handshake
- Minimal framing overhead (2-14 bytes per message)
- No built-in reconnection logic
- No automatic fallback transports
- Browser handles ping/pong automatically

### Socket.io Protocol Stack
```
┌─────────────────────────────────────────────────────────────┐
│                   Socket.io v4 Stack                        │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: Socket.io (rooms, namespaces, acknowledgments)   │
│  Layer 2: Engine.io (transport abstraction)                │
│  Layer 1: WebSocket / HTTP Long-polling                    │
│                                                             │
│  Example: socket.emit("chat", msg)                         │
│  Wire: 42["chat",{"text":"hello"}]                         │
│        ↑↑── Engine.IO packet type (4=message)              │
│          ↑── Socket.IO packet type (2=event)               │
└─────────────────────────────────────────────────────────────┘
```

**Key Characteristics:**
- Starts with HTTP long-polling, upgrades to WebSocket
- Packet encoding adds ~3-5 bytes + JSON overhead
- Built-in auto-reconnection with exponential backoff
- Room/namespace multiplexing on single connection
- Binary support with Base64 fallback for polling

---

## 2. Performance & Latency Comparison

### Connection Establishment Latency

| Phase | Native WebSocket | Socket.io |
|-------|-----------------|-----------|
| TCP Handshake | 1 RTT | 1 RTT |
| HTTP Upgrade | 1 RTT | 1 RTT |
| Engine.IO handshake | N/A | +1 RTT (SID exchange) |
| Socket.IO handshake | N/A | +1 RTT (connect event) |
| **Total** | **2 RTT** | **4 RTT** |

**Real-world impact:** Socket.io adds ~100-200ms to initial connection (assuming 50ms latency).

### Message Delivery Latency

| Scenario | Native WebSocket | Socket.io |
|----------|-----------------|-----------|
| Small text message (< 1KB) | ~0.1ms framing | ~0.3ms (encoding + framing) |
| Large payload (100KB) | ~2ms | ~3ms (JSON parse/stringify) |
| Binary data | Native (no copy) | Base64 encoded for polling fallback |

**Message Overhead:**
- WebSocket: 2-14 bytes header
- Socket.io: 3-5 bytes packet header + JSON payload

### Throughput Benchmarks (Estimated)

Based on typical Go server specs (4 vCPU, 8GB RAM):

| Metric | Native WebSocket | Socket.io |
|--------|-----------------|-----------|
| Max concurrent connections | ~50,000-100,000 | ~30,000-50,000 |
| Messages/sec per connection | 10,000+ | 5,000+ |
| Memory per connection | ~5-10 KB | ~15-25 KB |
| CPU usage (10k connections) | ~30% | ~50% |

---

## 3. Scalability Analysis

### Horizontal Scaling Requirements

**Native WebSocket Cluster Setup:**
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│  Nginx/     │────▶│  Server 1   │
│             │     │  Traefik    │     │  (Go + WS)  │
└─────────────┘     │  (sticky    │     └──────┬──────┘
                    │   session)  │            │
                    └─────────────┘     ┌──────┴──────┐
                                        │   Redis     │
                    ┌─────────────┐     │   Pub/Sub   │
                    │  Server 2   │◀────┤             │
                    │  (Go + WS)  │     │  Broadcast  │
                    └─────────────┘     └─────────────┘
```

**Key Requirements:**
1. **Sticky sessions** (mandatory for both)
2. **Redis Pub/Sub** for cross-server message broadcasting
3. **Connection limit** per server (file descriptor limits)

### Socket.io Cluster Complexity

Socket.io adds these scaling requirements:
```go
// Redis Adapter required for multi-node
import socketio "github.com/googollee/go-socket.io"

server, _ := socketio.NewServer(nil)
// Must configure Redis adapter
server.Adapter(&socketio.RedisAdapter{
    Host: "localhost",
    Port: 6379,
})
```

**Additional overhead:**
- Engine.IO session state must be shared
- Room/namespace state synchronization
- More complex load balancer configuration

---

## 4. Maintenance Complexity

### Native WebSocket (Gorilla)

**Pros:**
- Simple, explicit code flow
- Direct control over connection lifecycle
- Easy to debug (standard protocol)
- Minimal dependencies
- Well-documented Go patterns

**Cons:**
- Must implement reconnection logic yourself
- Must handle room management manually
- No built-in acknowledgment system

**Maintenance Score: 8/10** (Simple and predictable)

### Socket.io Go

**Pros:**
- Built-in reconnection
- Room/namespace abstraction
- Acknowledgment callbacks
- Auto-reconnect with backoff

**Cons:**
- Go implementation (`go-socket.io`) has **maintenance issues**:
  - Last significant update: 2022
  - Open issues: 200+
  - Compatibility issues with Socket.io v4 client
- Complex debugging (protocol layers)
- Heavy abstraction can obscure problems

**Maintenance Score: 4/10** (Unreliable Go library)

---

## 5. Go Library Ecosystem

### Recommended: Gorilla WebSocket

```go
import "github.com/gorilla/websocket"

// Simple, production-ready
upgrader := websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
    CheckOrigin: func(r *http.Request) bool {
        return true // Configure for production
    },
}
```

**Stats:**
- GitHub Stars: 20,000+
- Actively maintained
- Used by: Kubernetes, Docker, Prometheus
- Last update: 2024

### Socket.io Go: Not Recommended

```go
import "github.com/googollee/go-socket.io"
```

**Issues:**
- v1.4+ has breaking changes
- Memory leaks reported
- Not fully compatible with Socket.io v4 JavaScript client
- Documentation gaps

### Alternative: Native with Custom Protocol

Build minimal protocol on top of Gorilla:
```go
// Custom message envelope
type Message struct {
    Type    string          `json:"type"`    // "chat", "typing", "ack"
    ID      string          `json:"id"`      // For acknowledgments
    Payload json.RawMessage `json:"payload"`
}
```

---

## 6. SiteSpark Use Case Analysis

### Requirements
1. **AI Chat Streaming** - Real-time text streaming from Kimi API
2. **Typing Indicators** - User presence
3. **Authentication** - JWT-based
4. **Scalability** - Single server initially, horizontal scaling later
5. **Frontend** - React with existing Socket.io client stub

### WebSocket Implementation Pattern for SiteSpark

```go
// internal/websocket/manager.go
type Manager struct {
    clients    map[uuid.UUID]*Client  // userID -> Client
    register   chan *Client
    unregister chan *Client
    broadcast  chan Message
    db         *database.Database
    kimi       *ai.KimiClient
}

type Client struct {
    UserID uuid.UUID
    Conn   *websocket.Conn
    Send   chan []byte
    mu     sync.Mutex
}

// Message types matching frontend expectations
type WSMessage struct {
    Type    string      `json:"type"`    // "chat:message", "chat:typing", "chat:stream"
    ID      string      `json:"id"`
    Payload interface{} `json:"payload"`
}
```

### Streaming Chat Flow

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────┐
│  User   │────▶│   WebSocket │────▶│ KimiClient  │────▶│ Kimi    │
│ (React) │     │   Handler   │     │.ChatStream()│     │  API    │
└─────────┘     └──────┬──────┘     └─────────────┘     └─────────┘
     ▲                 │
     │                 │  Stream chunks via WebSocket
     │                 │  {type: "chat:stream", chunk: "Hello"}
     │                 │  {type: "chat:stream", chunk: " world"}
     └─────────────────┘
```

---

## 7. Recommendation for SiteSpark

### ✅ Use Native WebSocket (Gorilla)

**Rationale:**

1. **Latency Critical**: AI streaming requires minimal latency; Socket.io adds ~2 RTT overhead
2. **Simple Use Case**: We only need chat + typing indicators, not complex room management
3. **Go Ecosystem**: Gorilla is production-ready; go-socket.io is problematic
4. **Scalability**: Native WebSocket handles more connections per server
5. **Maintenance**: Simpler codebase, easier debugging

### Implementation Approach

**Backend (Go):**
```go
// New dependency
go get github.com/gorilla/websocket

// Files to create:
// - internal/websocket/manager.go
// - internal/websocket/client.go
// - internal/handlers/websocket.go

// Files to modify:
// - internal/services/ai/kimi.go (add streaming method)
// - cmd/api/main.go (register /ws route)
```

**Frontend (React):**
Replace stub socket.ts with native WebSocket:
```typescript
// src/lib/socket.ts
class SocketClient {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  connect() {
    const token = localStorage.getItem('token')
    this.ws = new WebSocket(`ws://localhost:3001/ws?token=${token}`)

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      this.handleMessage(msg)
    }

    this.ws.onclose = () => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => this.connect(), 1000 * Math.pow(2, this.reconnectAttempts))
        this.reconnectAttempts++
      }
    }
  }
}
```

### Migration Path

| Phase | Action | Effort |
|-------|--------|--------|
| 1 | Add Gorilla dependency + basic manager | 4 hours |
| 2 | Implement WebSocket handler with JWT auth | 4 hours |
| 3 | Add streaming chat to Kimi service | 6 hours |
| 4 | Update frontend socket.ts | 4 hours |
| 5 | Testing & optimization | 4 hours |
| **Total** | | **~22 hours** |

---

## 8. Alternative: Socket.io with Node.js Bridge

If Socket.io features are truly needed:

```
┌─────────┐     ┌──────────────┐     ┌─────────────┐
│  React  │────▶│  Node.js     │────▶│  Go Backend │
│  Client │     │  Socket.io   │     │  (API + WS) │
│         │◀────│  Bridge      │◀────│             │
└─────────┘     └──────────────┘     └─────────────┘
```

**Not recommended** - adds operational complexity and single point of failure.

---

## 9. Security Considerations

### WebSocket Security Checklist

- [ ] **Origin validation** in upgrader
- [ ] **JWT validation** before upgrade (via query param)
- [ ] **Rate limiting** per user (e.g., 100 msg/min)
- [ ] **Message size limits** (max 4KB)
- [ ] **Connection limits** per IP/user
- [ ] **WSS (TLS)** in production
- [ ] **Ping/pong** for stale connection detection

```go
upgrader := websocket.Upgrader{
    CheckOrigin: func(r *http.Request) bool {
        origin := r.Header.Get("Origin")
        return origin == "https://sitespark.id"
    },
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
    // Enable compression
    EnableCompression: true,
}
```

---

## 10. Conclusion

| Criteria | WebSocket (Gorilla) | Socket.io |
|----------|---------------------|-----------|
| **Latency** | ✅ Lower | Higher |
| **Scalability** | ✅ Better | Good |
| **Maintenance** | ✅ Simpler | Complex |
| **Go Ecosystem** | ✅ Mature | ❌ Problematic |
| **Features** | Basic | Rich |
| **SiteSpark Fit** | ✅ Perfect | Overkill |

**Final Recommendation: Use Native WebSocket with Gorilla**

It provides the best balance of performance, simplicity, and maintainability for SiteSpark's real-time AI chat requirements.

---

## References

1. [Gorilla WebSocket GitHub](https://github.com/gorilla/websocket)
2. [Socket.io v4 Protocol](https://socket.io/docs/v4/)
3. [RFC 6455 - WebSocket Protocol](https://tools.ietf.org/html/rfc6455)
4. [Centrifugal - Scaling WebSocket](https://centrifugal.dev/blog/2020/11/12/scaling-websocket)
5. [Engine.IO Protocol](https://socket.io/docs/v4/engine-io-protocol/)
