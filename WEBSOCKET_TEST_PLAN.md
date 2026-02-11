# WebSocket Test Plan

## Overview

This document outlines comprehensive test scenarios for the WebSocket implementation in SiteSpark Go backend.

## Test Categories

### 1. Unit Tests

#### WebSocket Manager Tests (`internal/websocket/manager_test.go`)

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| `TestNewManager` | Verify manager initialization | Manager created with all channels initialized |
| `TestManager_Run` | Test client registration/unregistration | Clients correctly added/removed from registry |
| `TestManager_SendToUser` | Send message to specific user | Message delivered to correct client |
| `TestManager_Broadcast` | Broadcast to all clients | All connected clients receive message |
| `TestClient_SendMessage` | Send message to client | Message queued in client channel |
| `TestClient_SendMessage_ChannelBlocked` | Handle full channel gracefully | No panic, returns immediately |
| `TestUpgrader` | Verify upgrader configuration | Correct buffer sizes and origin check |
| `TestManager_HandleWebSocket` | Test full connection flow | Connection upgraded, client registered |
| `TestMessage_MarshalUnmarshal` | Message serialization | JSON encode/decode works correctly |
| `TestManager_ConcurrentAccess` | Concurrent registrations | Thread-safe, no race conditions |
| `TestManager_SingleConnectionPerUser` | Only one connection per user | Previous connection closed on new connection |

#### WebSocket Handler Tests (`internal/handlers/websocket_test.go`)

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| `TestNewWebSocketHandler` | Handler initialization | All dependencies set correctly |
| `TestWebSocketHandler_HandleWebSocket_NoToken` | Reject connection without token | 401 Unauthorized |
| `TestWebSocketHandler_HandleWebSocket_InvalidToken` | Reject invalid token | 401 Unauthorized |
| `TestWebSocketHandler_handleChatMessage_EmptyContent` | Reject empty message | Error response sent |
| `TestWebSocketHandler_handleChatMessage_WithContent` | Process valid chat message | Acknowledgment + AI response |
| `TestWebSocketHandler_handleTypingIndicator` | Handle typing indicator | Echo back to sender |
| `TestWebSocketHandler_handleWebsiteJoin_NoWebsiteID` | Reject join without ID | Error response sent |
| `TestWebSocketHandler_handleWebsiteJoin_InvalidWebsiteID` | Reject invalid ID | Error response sent |
| `TestWebSocketHandler_handleWebsiteLeave` | Handle website leave | Confirmation sent |
| `TestWebSocketHandler_sendError` | Send error message | Error formatted correctly |
| `TestWebSocketHandler_sendToClient` | Send message to client | Message delivered |
| `TestWebSocketHandler_handleMessage` | Route different message types | Correct handler called |
| `TestWebSocketHandler_ChatHistoryManagement` | Maintain chat history | History stored and retrieved |
| `TestWebSocketHandler_ChatHistoryLimit` | Limit history size | Max 20 messages maintained |

### 2. Integration Tests

#### Full Flow Tests (`internal/websocket/integration_test.go`)

| Test Case | Description | Command |
|-----------|-------------|---------|
| `TestIntegration_WebSocketFullFlow` | Complete connection lifecycle | `go test -tags=integration -run TestIntegration_WebSocketFullFlow ./internal/websocket/...` |
| `TestIntegration_WebSocketBroadcast` | Multi-client broadcast | `go test -tags=integration -run TestIntegration_WebSocketBroadcast ./internal/websocket/...` |
| `TestIntegration_WebSocketReconnection` | Disconnect and reconnect | `go test -tags=integration -run TestIntegration_WebSocketReconnection ./internal/websocket/...` |

### 3. Manual Test Scenarios

#### 3.1 Connection Tests

**Scenario 1: Basic Connection**
```bash
# Get valid JWT token first (login via API)
TOKEN="your-jwt-token"

# Connect WebSocket
wscat -c "ws://localhost:3001/ws?token=$TOKEN"

# Expected:
# - Connection established
# - Receive {"type":"connected",...} message
```

**Scenario 2: Connection Without Token**
```bash
wscat -c "ws://localhost:3001/ws"

# Expected:
# - Connection rejected with 401 Unauthorized
```

**Scenario 3: Connection With Invalid Token**
```bash
wscat -c "ws://localhost:3001/ws?token=invalid.token.here"

# Expected:
# - Connection rejected with 401 Unauthorized
```

**Scenario 4: Expired Token**
```bash
# Use an expired JWT token
wscat -c "ws://localhost:3001/ws?token=$EXPIRED_TOKEN"

# Expected:
# - Connection rejected with 401 Unauthorized
```

#### 3.2 Message Exchange Tests

**Scenario 5: Send Chat Message**
```bash
# Connect first
wscat -c "ws://localhost:3001/ws?token=$TOKEN"

# Send message
> {"type":"chat:message","content":"Hello AI"}

# Expected:
# - Receive user message acknowledgment
# - Receive streaming chunks: {"type":"chat:stream","chunk":"..."}
# - Receive final message: {"type":"chat:message","role":"assistant","content":"..."}
```

**Scenario 6: Send Typing Indicator**
```bash
# Send typing indicator
> {"type":"chat:typing","isTyping":true}

# Expected:
# - Receive: {"type":"chat:typing","userId":"...","isTyping":true}
```

**Scenario 7: Join Website Room**
```bash
# Send join message
> {"type":"website:join","websiteId":"valid-website-uuid"}

# Expected:
# - Receive confirmation: {"type":"website:join","websiteId":"..."}
```

**Scenario 8: Leave Website Room**
```bash
# Send leave message
> {"type":"website:leave","websiteId":"valid-website-uuid"}

# Expected:
# - Receive confirmation: {"type":"website:leave","websiteId":"..."}
```

#### 3.3 Error Handling Tests

**Scenario 9: Invalid JSON**
```bash
# Send invalid JSON
> this is not json

# Expected:
# - Receive: {"type":"error","error":"Invalid message format"}
# - Connection remains open
```

**Scenario 10: Unknown Message Type**
```bash
# Send unknown type
> {"type":"unknown:type","data":"test"}

# Expected:
# - Receive: {"type":"error","error":"Unknown message type"}
```

**Scenario 11: Empty Content**
```bash
# Send empty content
> {"type":"chat:message","content":""}

# Expected:
# - Receive: {"type":"error","error":"Message content is required"}
```

**Scenario 12: Invalid Website ID**
```bash
# Send invalid UUID
> {"type":"website:join","websiteId":"not-a-uuid"}

# Expected:
# - Receive: {"type":"error","error":"Invalid website ID"}
```

#### 3.4 Concurrent Connection Tests

**Scenario 13: Multiple Connections Same User**
```bash
# Terminal 1 - First connection
wscat -c "ws://localhost:3001/ws?token=$TOKEN"

# Terminal 2 - Second connection with same token
wscat -c "ws://localhost:3001/ws?token=$TOKEN"

# Expected:
# - Both connect successfully
# - First connection closed when second connects
# - Server maintains only one connection per user
```

**Scenario 14: Broadcast to Multiple Users**
```bash
# Terminal 1 - User 1
wscat -c "ws://localhost:3001/ws?token=$TOKEN1"

# Terminal 2 - User 2
wscat -c "ws://localhost:3001/ws?token=$TOKEN2"

# Terminal 3 - User 3
wscat -c "ws://localhost:3001/ws?token=$TOKEN3"

# Send typing indicator from any user
# Expected:
# - All connected users receive the typing indicator
```

#### 3.5 AI Streaming Tests

**Scenario 15: AI Response Streaming**
```bash
# Connect and send message
wscat -c "ws://localhost:3001/ws?token=$TOKEN"
> {"type":"chat:message","content":"Tell me a story"}

# Expected:
# - Multiple stream chunks received: {"type":"chat:stream","chunk":"word","id":"..."}
# - Final complete message: {"type":"chat:message","role":"assistant","content":"full story"}
# - Chunks arrive sequentially without delay
```

**Scenario 16: Chat History Maintenance**
```bash
# Send multiple messages
> {"type":"chat:message","content":"Message 1"}
> {"type":"chat:message","content":"Message 2"}
> {"type":"chat:message","content":"Message 3"}

# Expected:
# - Each message receives appropriate context-aware response
# - AI remembers context from previous messages
```

#### 3.6 Reconnection Tests

**Scenario 17: Auto Reconnection**
```javascript
// Frontend test
socket.connect()
// Wait for connection

// Kill server or disconnect network
// Wait for reconnection attempt

// Server comes back online
// Expected:
// - Frontend automatically reconnects
// - Pending messages are sent after reconnection
```

**Scenario 18: Connection Persistence**
```bash
# Connect
wscat -c "ws://localhost:3001/ws?token=$TOKEN"

# Keep connection idle for 5 minutes

# Expected:
# - Connection remains open (ping/pong keeps it alive)
# - Can still send/receive messages
```

#### 3.7 Performance Tests

**Scenario 19: Load Test - Many Connections**
```bash
# Use a load testing tool like Artillery or k6
# Simulate 1000 concurrent connections

# Expected:
# - All connections established successfully
# - Messages delivered without significant delay
# - Server memory usage remains stable
```

**Scenario 20: Message Throughput**
```bash
# Send 1000 messages rapidly
for i in {1..1000}; do
  echo '{"type":"chat:message","content":"test"}'
done | wscat -c "ws://localhost:3001/ws?token=$TOKEN"

# Expected:
# - All messages processed
# - No server crashes or memory leaks
```

### 4. Frontend Integration Tests

#### 4.1 Socket Client Tests

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Connection on Login | Login to app, navigate to chat | WebSocket connects automatically |
| Reconnection on Token Refresh | Wait for token refresh | Connection maintained with new token |
| Message Sending | Type message and send | Message appears in chat, AI responds |
| Streaming Display | Send message requiring long response | Text appears word-by-word (typewriter effect) |
| Typing Indicator | Type in input field | Typing indicator shown to other users |
| Disconnect on Logout | Click logout | WebSocket disconnects cleanly |
| Reconnect on Network Recovery | Disconnect and reconnect network | Auto-reconnect with exponential backoff |

#### 4.2 Error Handling Tests

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Server Error | Server returns error message | Error displayed in UI, connection maintained |
| Connection Lost | Server goes down | UI shows "Reconnecting..." indicator |
| Max Reconnect Attempts | Keep server down | UI shows "Connection failed" after max attempts |
| Invalid Message | Send malformed message | Error logged, connection maintained |

### 5. Security Tests

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Token Validation | Try to connect with tampered token | Connection rejected |
| Origin Check | Connect from unauthorized origin | Connection rejected (in production) |
| Message Size Limit | Send message > 4096 bytes | Connection closed or error returned |
| Rate Limiting | Send 100 messages in 1 second | Rate limit applied, excess messages rejected |
| SQL Injection | Send message with SQL in content | Message handled as text, no SQL executed |
| XSS Attempt | Send message with script tags | Content sanitized or escaped |

## Test Execution Commands

### Run All Tests
```bash
cd apps/backend-go

# Run unit tests
go test ./internal/websocket/... -v
go test ./internal/handlers/... -v -run WebSocket

# Run integration tests
go test -tags=integration ./internal/websocket/... -v

# Run with race detection
go test -race ./internal/websocket/...

# Run with coverage
go test -cover ./internal/websocket/...
go test -coverprofile=coverage.out ./internal/websocket/...
go tool cover -html=coverage.out -o coverage.html
```

### Manual Testing with wscat
```bash
# Install wscat
npm install -g wscat

# Get JWT token (after login)
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  | jq -r '.token')

# Connect WebSocket
wscat -c "ws://localhost:3001/ws?token=$TOKEN"

# Send messages interactively
> {"type":"chat:message","content":"Hello"}
```

### Load Testing with k6
```javascript
// websocket-load-test.js
import ws from 'k6/ws';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '1m', target: 0 },
  ],
};

export default function () {
  const token = 'your-jwt-token';
  const url = `ws://localhost:3001/ws?token=${token}`;

  const res = ws.connect(url, null, function (socket) {
    socket.on('open', () => {
      socket.send(JSON.stringify({
        type: 'chat:message',
        content: 'Load test message'
      }));
    });

    socket.on('message', (data) => {
      check(data, {
        'message received': (d) => d.length > 0,
      });
    });

    socket.setTimeout(function () {
      socket.close();
    }, 30000);
  });

  check(res, { 'status is 101': (r) => r && r.status === 101 });
}
```

Run with: `k6 run websocket-load-test.js`

## Success Criteria

All tests must pass with the following criteria:

1. **Unit Tests**: 100% pass rate
2. **Integration Tests**: 100% pass rate
3. **Manual Tests**: All scenarios completed successfully
4. **Performance Tests**:
   - Connection establishment < 100ms
   - Message delivery < 50ms
   - Support 10,000 concurrent connections
   - Memory usage < 1GB at max load
5. **Security Tests**: All security scenarios properly handled

## Bug Reporting Template

When reporting WebSocket bugs, include:

```markdown
**Test Scenario**: [Scenario number/name]
**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Result**:
**Actual Result**:
**Error Messages**:
**Environment**:
- Backend version:
- Frontend version:
- Browser (if applicable):
- OS:

**Logs**:
[Include relevant server/client logs]

**Additional Context**:
[Any other relevant information]
```
