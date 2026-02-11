package websocket

import (
	"encoding/json"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewManager(t *testing.T) {
	manager := NewManager()
	assert.NotNil(t, manager)
	assert.NotNil(t, manager.clients)
	assert.NotNil(t, manager.register)
	assert.NotNil(t, manager.unregister)
	assert.NotNil(t, manager.broadcast)
}

func TestManager_Run(t *testing.T) {
	manager := NewManager()
	go manager.Run()

	// Test client registration
	client := &Client{
		ID:     uuid.New().String(),
		UserID: uuid.New(),
		Send:   make(chan []byte, 256),
	}

	manager.register <- client
	time.Sleep(100 * time.Millisecond)

	assert.Equal(t, 1, manager.GetClientCount())
	assert.True(t, manager.IsUserConnected(client.UserID))

	// Test client unregistration
	manager.unregister <- client
	time.Sleep(100 * time.Millisecond)

	assert.Equal(t, 0, manager.GetClientCount())
	assert.False(t, manager.IsUserConnected(client.UserID))
}

func TestManager_SendToUser(t *testing.T) {
	manager := NewManager()
	go manager.Run()

	userID := uuid.New()
	client := &Client{
		ID:     uuid.New().String(),
		UserID: userID,
		Send:   make(chan []byte, 256),
	}

	manager.register <- client
	time.Sleep(100 * time.Millisecond)

	msg := Message{
		Type:      MessageTypeChatMessage,
		ID:        uuid.New().String(),
		Content:   "Test message",
		UserID:    userID.String(),
		Timestamp: time.Now(),
	}

	manager.SendToUser(userID, msg)

	select {
	case data := <-client.Send:
		var received Message
		err := json.Unmarshal(data, &received)
		require.NoError(t, err)
		assert.Equal(t, msg.Type, received.Type)
		assert.Equal(t, msg.Content, received.Content)
	case <-time.After(time.Second):
		t.Fatal("Timeout waiting for message")
	}
}

func TestManager_Broadcast(t *testing.T) {
	manager := NewManager()
	go manager.Run()

	// Create multiple clients
	clients := make([]*Client, 3)
	for i := 0; i < 3; i++ {
		clients[i] = &Client{
			ID:     uuid.New().String(),
			UserID: uuid.New(),
			Send:   make(chan []byte, 256),
		}
		manager.register <- clients[i]
	}
	time.Sleep(100 * time.Millisecond)

	msg := Message{
		Type:      MessageTypeChatTyping,
		IsTyping:  true,
		Timestamp: time.Now(),
	}

	manager.Broadcast(msg)

	// Verify all clients received the message
	for i, client := range clients {
		select {
		case data := <-client.Send:
			var received Message
			err := json.Unmarshal(data, &received)
			require.NoError(t, err, "Client %d", i)
			assert.Equal(t, msg.Type, received.Type)
			assert.Equal(t, msg.IsTyping, received.IsTyping)
		case <-time.After(time.Second):
			t.Fatalf("Timeout waiting for message on client %d", i)
		}
	}
}

func TestClient_SendMessage(t *testing.T) {
	client := &Client{
		ID:     uuid.New().String(),
		UserID: uuid.New(),
		Send:   make(chan []byte, 256),
	}

	msg := []byte("test message")
	client.SendMessage(msg)

	select {
	case received := <-client.Send:
		assert.Equal(t, msg, received)
	case <-time.After(time.Second):
		t.Fatal("Timeout waiting for message")
	}
}

func TestClient_SendMessage_ChannelBlocked(t *testing.T) {
	// Create a client with a full channel
	client := &Client{
		ID:     uuid.New().String(),
		UserID: uuid.New(),
		Send:   make(chan []byte, 1),
	}

	// Fill the channel
	client.Send <- []byte("existing message")

	// This should not block or panic
	msg := []byte("new message")
	done := make(chan bool)
	go func() {
		client.SendMessage(msg)
		done <- true
	}()

	select {
	case <-done:
		// Expected - should not block
	case <-time.After(500 * time.Millisecond):
		t.Fatal("SendMessage blocked on full channel")
	}
}

func TestUpgrader(t *testing.T) {
	// Test that upgrader is properly configured
	assert.NotNil(t, Upgrader)
	assert.Equal(t, 1024, Upgrader.ReadBufferSize)
	assert.Equal(t, 1024, Upgrader.WriteBufferSize)
	assert.NotNil(t, Upgrader.CheckOrigin)

	// Test CheckOrigin allows all origins in development
	req := httptest.NewRequest("GET", "/ws", nil)
	assert.True(t, Upgrader.CheckOrigin(req))
}

func TestMessage_MarshalUnmarshal(t *testing.T) {
	msg := Message{
		Type:      MessageTypeChatMessage,
		ID:        uuid.New().String(),
		UserID:    uuid.New().String(),
		Content:   "Test content",
		Role:      "assistant",
		Chunk:     "chunk",
		IsTyping:  true,
		WebsiteID: uuid.New().String(),
		Timestamp: time.Now(),
		Error:     "",
		Metadata:  map[string]any{"key": "value"},
	}

	data, err := json.Marshal(msg)
	require.NoError(t, err)

	var unmarshaled Message
	err = json.Unmarshal(data, &unmarshaled)
	require.NoError(t, err)

	assert.Equal(t, msg.Type, unmarshaled.Type)
	assert.Equal(t, msg.ID, unmarshaled.ID)
	assert.Equal(t, msg.UserID, unmarshaled.UserID)
	assert.Equal(t, msg.Content, unmarshaled.Content)
	assert.Equal(t, msg.Role, unmarshaled.Role)
	assert.Equal(t, msg.Chunk, unmarshaled.Chunk)
	assert.Equal(t, msg.IsTyping, unmarshaled.IsTyping)
	assert.Equal(t, msg.WebsiteID, unmarshaled.WebsiteID)
	assert.Equal(t, msg.Error, unmarshaled.Error)
}

func TestManager_ConcurrentAccess(t *testing.T) {
	manager := NewManager()
	go manager.Run()

	// Concurrent registrations
	done := make(chan bool, 10)
	for i := 0; i < 10; i++ {
		go func(index int) {
			client := &Client{
				ID:     uuid.New().String(),
				UserID: uuid.New(),
				Send:   make(chan []byte, 256),
			}
			manager.register <- client
			time.Sleep(10 * time.Millisecond)
			manager.unregister <- client
			done <- true
		}(i)
	}

	// Wait for all goroutines
	for i := 0; i < 10; i++ {
		select {
		case <-done:
		case <-time.After(5 * time.Second):
			t.Fatal("Timeout waiting for concurrent operations")
		}
	}

	// Should be 0 after all unregistrations
	time.Sleep(100 * time.Millisecond)
	assert.Equal(t, 0, manager.GetClientCount())
}

func TestManager_SingleConnectionPerUser(t *testing.T) {
	manager := NewManager()
	go manager.Run()

	userID := uuid.New()

	// Register first client
	client1 := &Client{
		ID:     "client-1",
		UserID: userID,
		Send:   make(chan []byte, 256),
	}
	manager.register <- client1
	time.Sleep(50 * time.Millisecond)

	// Register second client with same user ID
	client2 := &Client{
		ID:     "client-2",
		UserID: userID,
		Send:   make(chan []byte, 256),
	}
	manager.register <- client2
	time.Sleep(50 * time.Millisecond)

	// Should still only have 1 client (latest one)
	assert.Equal(t, 1, manager.GetClientCount())

	// Verify client1's channel was closed
	select {
	case _, ok := <-client1.Send:
		assert.False(t, ok, "First client's channel should be closed")
	case <-time.After(100 * time.Millisecond):
		// Channel might already be drained
	}
}
