//go:build integration
// +build integration

package websocket

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"backend-go/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Integration tests for WebSocket functionality
// Run with: go test -tags=integration ./internal/websocket/...

func TestIntegration_WebSocketFullFlow(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Setup
	manager := NewManager()
	go manager.Run()

	jwtUtil := utils.NewJWTUtil(&utils.JWTConfig{
		Secret:    "test-secret-key-for-integration-tests",
		ExpiresIn: time.Hour,
	})

	userID := uuid.New()
	token, err := jwtUtil.GenerateToken(userID, "test@example.com")
	require.NoError(t, err)

	messageReceived := make(chan Message, 10)
	handler := func(client *Client, msg Message) {
		messageReceived <- msg
	}

	// Create test server
	router := gin.New()
	router.GET("/ws", func(c *gin.Context) {
		// Validate token from query
		tokenStr := c.Query("token")
		if tokenStr == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token required"})
			return
		}

		claims, err := jwtUtil.ValidateToken(tokenStr)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			return
		}

		manager.HandleWebSocket(c, claims.UserID, handler)
	})

	server := httptest.NewServer(router)
	defer server.Close()

	// Convert http:// to ws://
	wsURL := "ws" + strings.TrimPrefix(server.URL, "http") + "/ws?token=" + token

	t.Run("Connect and receive confirmation", func(t *testing.T) {
		ws, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
		require.NoError(t, err)
		defer ws.Close()

		// Wait for connected confirmation
		ws.SetReadDeadline(time.Now().Add(2 * time.Second))
		_, data, err := ws.ReadMessage()
		require.NoError(t, err)

		var msg Message
		err = json.Unmarshal(data, &msg)
		require.NoError(t, err)
		assert.Equal(t, MessageTypeConnected, msg.Type)
		assert.NotEmpty(t, msg.ID)
		assert.Equal(t, userID.String(), msg.UserID)
	})

	t.Run("Send and receive chat message", func(t *testing.T) {
		ws, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
		require.NoError(t, err)
		defer ws.Close()

		// Skip connected message
		ws.SetReadDeadline(time.Now().Add(2 * time.Second))
		ws.ReadMessage()

		// Send chat message
		sendMsg := Message{
			Type:    MessageTypeChatMessage,
			Content: "Hello, WebSocket!",
		}
		data, _ := json.Marshal(sendMsg)
		err = ws.WriteMessage(websocket.TextMessage, data)
		require.NoError(t, err)

		// Wait for message to be received by handler
		select {
		case received := <-messageReceived:
			assert.Equal(t, MessageTypeChatMessage, received.Type)
			assert.Equal(t, "Hello, WebSocket!", received.Content)
		case <-time.After(2 * time.Second):
			t.Fatal("Timeout waiting for message")
		}
	})

	t.Run("Send typing indicator", func(t *testing.T) {
		ws, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
		require.NoError(t, err)
		defer ws.Close()

		// Skip connected message
		ws.SetReadDeadline(time.Now().Add(2 * time.Second))
		ws.ReadMessage()

		// Send typing indicator
		sendMsg := Message{
			Type:     MessageTypeChatTyping,
			IsTyping: true,
		}
		data, _ := json.Marshal(sendMsg)
		err = ws.WriteMessage(websocket.TextMessage, data)
		require.NoError(t, err)

		// Wait for typing indicator to be received
		select {
		case received := <-messageReceived:
			assert.Equal(t, MessageTypeChatTyping, received.Type)
			assert.True(t, received.IsTyping)
		case <-time.After(2 * time.Second):
			t.Fatal("Timeout waiting for typing indicator")
		}
	})

	t.Run("Handle invalid JSON", func(t *testing.T) {
		ws, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
		require.NoError(t, err)
		defer ws.Close()

		// Skip connected message
		ws.SetReadDeadline(time.Now().Add(2 * time.Second))
		ws.ReadMessage()

		// Send invalid JSON
		err = ws.WriteMessage(websocket.TextMessage, []byte("invalid json"))
		require.NoError(t, err)

		// Should receive error response
		ws.SetReadDeadline(time.Now().Add(2 * time.Second))
		_, data, err := ws.ReadMessage()
		require.NoError(t, err)

		var msg Message
		err = json.Unmarshal(data, &msg)
		require.NoError(t, err)
		assert.Equal(t, MessageTypeError, msg.Type)
		assert.Contains(t, msg.Error, "Invalid message format")
	})

	t.Run("Multiple connections same user", func(t *testing.T) {
		// First connection
		ws1, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
		require.NoError(t, err)
		defer ws1.Close()

		// Skip connected message for ws1
		ws1.SetReadDeadline(time.Now().Add(2 * time.Second))
		ws1.ReadMessage()

		// Second connection with same user
		ws2, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
		require.NoError(t, err)
		defer ws2.Close()

		// Skip connected message for ws2
		ws2.SetReadDeadline(time.Now().Add(2 * time.Second))
		ws2.ReadMessage()

		// Give time for server to process
		time.Sleep(100 * time.Millisecond)

		// Manager should only have 1 client (latest connection)
		assert.Equal(t, 1, manager.GetClientCount())
	})

	t.Run("Connection without token", func(t *testing.T) {
		wsURLNoToken := "ws" + strings.TrimPrefix(server.URL, "http") + "/ws"
		_, resp, err := websocket.DefaultDialer.Dial(wsURLNoToken, nil)
		require.Error(t, err)
		assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	})

	t.Run("Connection with invalid token", func(t *testing.T) {
		wsURLInvalid := "ws" + strings.TrimPrefix(server.URL, "http") + "/ws?token=invalid.token.here"
		_, resp, err := websocket.DefaultDialer.Dial(wsURLInvalid, nil)
		require.Error(t, err)
		assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	})
}

func TestIntegration_WebSocketBroadcast(t *testing.T) {
	gin.SetMode(gin.TestMode)

	manager := NewManager()
	go manager.Run()

	jwtUtil := utils.NewJWTUtil(&utils.JWTConfig{
		Secret:    "test-secret-key-for-integration-tests",
		ExpiresIn: time.Hour,
	})

	// Create test server
	router := gin.New()
	router.GET("/ws", func(c *gin.Context) {
		tokenStr := c.Query("token")
		claims, _ := jwtUtil.ValidateToken(tokenStr)
		manager.HandleWebSocket(c, claims.UserID, nil)
	})

	server := httptest.NewServer(router)
	defer server.Close()

	// Connect multiple clients
	clients := make([]*websocket.Conn, 3)
	userIDs := make([]uuid.UUID, 3)

	for i := 0; i < 3; i++ {
		userIDs[i] = uuid.New()
		token, _ := jwtUtil.GenerateToken(userIDs[i], "test@example.com")
		wsURL := "ws" + strings.TrimPrefix(server.URL, "http") + "/ws?token=" + token

		ws, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
		require.NoError(t, err)

		// Skip connected message
		ws.SetReadDeadline(time.Now().Add(2 * time.Second))
		ws.ReadMessage()

		clients[i] = ws
		defer ws.Close()
	}

	// Wait for all clients to register
	time.Sleep(100 * time.Millisecond)
	assert.Equal(t, 3, manager.GetClientCount())

	// Broadcast message to all
	broadcastMsg := Message{
		Type:    MessageTypeChatMessage,
		Content: "Broadcast to all!",
	}
	manager.Broadcast(broadcastMsg)

	// Verify all clients received the message
	for i, ws := range clients {
		ws.SetReadDeadline(time.Now().Add(2 * time.Second))
		_, data, err := ws.ReadMessage()
		require.NoError(t, err, "Client %d should receive broadcast", i)

		var msg Message
		err = json.Unmarshal(data, &msg)
		require.NoError(t, err)
		assert.Equal(t, broadcastMsg.Type, msg.Type)
		assert.Equal(t, broadcastMsg.Content, msg.Content)
	}
}

func TestIntegration_WebSocketReconnection(t *testing.T) {
	gin.SetMode(gin.TestMode)

	manager := NewManager()
	go manager.Run()

	jwtUtil := utils.NewJWTUtil(&utils.JWTConfig{
		Secret:    "test-secret-key-for-integration-tests",
		ExpiresIn: time.Hour,
	})

	userID := uuid.New()
	token, _ := jwtUtil.GenerateToken(userID, "test@example.com")

	router := gin.New()
	router.GET("/ws", func(c *gin.Context) {
		tokenStr := c.Query("token")
		claims, _ := jwtUtil.ValidateToken(tokenStr)
		manager.HandleWebSocket(c, claims.UserID, nil)
	})

	server := httptest.NewServer(router)
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http") + "/ws?token=" + token

	// Connect
	ws, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	require.NoError(t, err)

	// Skip connected message
	ws.SetReadDeadline(time.Now().Add(2 * time.Second))
	ws.ReadMessage()

	// Verify connection
	time.Sleep(100 * time.Millisecond)
	assert.Equal(t, 1, manager.GetClientCount())

	// Close connection
	ws.Close()

	// Wait for disconnect to be processed
	time.Sleep(200 * time.Millisecond)
	assert.Equal(t, 0, manager.GetClientCount())

	// Reconnect
	ws2, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	require.NoError(t, err)
	defer ws2.Close()

	// Skip connected message
	ws2.SetReadDeadline(time.Now().Add(2 * time.Second))
	ws2.ReadMessage()

	time.Sleep(100 * time.Millisecond)
	assert.Equal(t, 1, manager.GetClientCount())
}
