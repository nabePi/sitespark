package websocket

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/sirupsen/logrus"
)

// Upgrader configures the WebSocket upgrader
var Upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow all origins in development
		// In production, this should be restricted
		return true
	},
}

// Client represents a WebSocket client connection
type Client struct {
	ID     string
	UserID uuid.UUID
	Conn   *websocket.Conn
	Send   chan []byte
	mu     sync.Mutex
}

// SendMessage sends a message to the client safely
func (c *Client) SendMessage(message []byte) {
	c.mu.Lock()
	defer c.mu.Unlock()

	select {
	case c.Send <- message:
	default:
		// Channel is full or closed
		logrus.Warnf("Send channel blocked for client %s", c.ID)
	}
}

// Message types for WebSocket communication
type MessageType string

const (
	MessageTypeChatMessage   MessageType = "chat:message"
	MessageTypeChatStream    MessageType = "chat:stream"
	MessageTypeChatTyping    MessageType = "chat:typing"
	MessageTypeWebsiteJoin   MessageType = "website:join"
	MessageTypeWebsiteLeave  MessageType = "website:leave"
	MessageTypeError         MessageType = "error"
	MessageTypeConnected     MessageType = "connected"
	MessageTypeDisconnected  MessageType = "disconnected"
)

// Message represents a WebSocket message
type Message struct {
	Type      MessageType    `json:"type"`
	ID        string         `json:"id,omitempty"`
	UserID    string         `json:"userId,omitempty"`
	Content   string         `json:"content,omitempty"`
	Role      string         `json:"role,omitempty"`
	Chunk     string         `json:"chunk,omitempty"`
	IsTyping  bool           `json:"isTyping,omitempty"`
	WebsiteID string         `json:"websiteId,omitempty"`
	Timestamp time.Time      `json:"timestamp,omitempty"`
	Error     string         `json:"error,omitempty"`
	Metadata  map[string]any `json:"metadata,omitempty"`
}

// Manager manages WebSocket connections
type Manager struct {
	clients    map[string]*Client // userID -> Client
	register   chan *Client
	unregister chan *Client
	broadcast  chan Message
	mu         sync.RWMutex
}

// NewManager creates a new WebSocket manager
func NewManager() *Manager {
	return &Manager{
		clients:    make(map[string]*Client),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan Message, 256),
	}
}

// Run starts the WebSocket manager event loop
func (m *Manager) Run() {
	for {
		select {
		case client := <-m.register:
			m.mu.Lock()
			// Close existing connection for this user (only one connection per user)
			if existing, ok := m.clients[client.UserID.String()]; ok {
				logrus.Infof("Closing existing connection for user %s", client.UserID)
				// Safely close the Send channel
				if existing.Send != nil {
					select {
					case <-existing.Send:
						// Channel already closed
					default:
						close(existing.Send)
					}
				}
				if existing.Conn != nil {
					existing.Conn.Close()
				}
			}
			m.clients[client.UserID.String()] = client
			m.mu.Unlock()
			logrus.Infof("Client connected: %s (user: %s)", client.ID, client.UserID)

			// Send connected confirmation (only if connection exists)
			if client.Conn != nil {
				msg := Message{
					Type:      MessageTypeConnected,
					ID:        client.ID,
					UserID:    client.UserID.String(),
					Timestamp: time.Now(),
				}
				if data, err := json.Marshal(msg); err == nil {
					select {
					case client.Send <- data:
					default:
					}
				}
			}

		case client := <-m.unregister:
			m.mu.Lock()
			if _, ok := m.clients[client.UserID.String()]; ok {
				delete(m.clients, client.UserID.String())
				// Safely close the Send channel
				if client.Send != nil {
					select {
					case <-client.Send:
						// Channel already closed
					default:
						close(client.Send)
					}
				}
				if client.Conn != nil {
					client.Conn.Close()
				}
				logrus.Infof("Client disconnected: %s (user: %s)", client.ID, client.UserID)
			}
			m.mu.Unlock()

		case message := <-m.broadcast:
			m.mu.RLock()
			clients := make(map[string]*Client)
			for k, v := range m.clients {
				clients[k] = v
			}
			m.mu.RUnlock()

			data, err := json.Marshal(message)
			if err != nil {
				logrus.WithError(err).Error("Failed to marshal broadcast message")
				continue
			}

			// Send to specific user if specified
			if message.UserID != "" {
				if client, ok := clients[message.UserID]; ok {
					client.SendMessage(data)
				}
			} else {
				// Broadcast to all clients
				for _, client := range clients {
					client.SendMessage(data)
				}
			}
		}
	}
}

// SendToUser sends a message to a specific user
func (m *Manager) SendToUser(userID uuid.UUID, message Message) {
	m.broadcast <- message
}

// Broadcast sends a message to all connected clients
func (m *Manager) Broadcast(message Message) {
	m.broadcast <- message
}

// GetClientCount returns the number of connected clients
func (m *Manager) GetClientCount() int {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return len(m.clients)
}

// IsUserConnected checks if a user is currently connected
func (m *Manager) IsUserConnected(userID uuid.UUID) bool {
	m.mu.RLock()
	defer m.mu.RUnlock()
	_, ok := m.clients[userID.String()]
	return ok
}

// ReadPump pumps messages from the WebSocket connection to the manager
func (m *Manager) ReadPump(client *Client, handler MessageHandler) {
	defer func() {
		m.unregister <- client
	}()

	client.Conn.SetReadLimit(4096) // Max message size
	client.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	client.Conn.SetPongHandler(func(string) error {
		client.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, data, err := client.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				logrus.WithError(err).Warn("WebSocket unexpected close error")
			}
			break
		}

		var msg Message
		if err := json.Unmarshal(data, &msg); err != nil {
			logrus.WithError(err).Warn("Failed to unmarshal WebSocket message")
			// Send error back to client
			errorMsg := Message{
				Type:      MessageTypeError,
				Error:     "Invalid message format",
				Timestamp: time.Now(),
			}
			if data, err := json.Marshal(errorMsg); err == nil {
				client.Send <- data
			}
			continue
		}

		// Handle message
		if handler != nil {
			handler(client, msg)
		}
	}
}

// WritePump pumps messages from the manager to the WebSocket connection
func (m *Manager) WritePump(client *Client) {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		client.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-client.Send:
			client.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				// Channel closed
				client.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := client.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued messages to the current WebSocket message
			n := len(client.Send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-client.Send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			client.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := client.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// MessageHandler is a function that handles WebSocket messages
type MessageHandler func(client *Client, msg Message)

// HandleWebSocket upgrades HTTP connection to WebSocket
func (m *Manager) HandleWebSocket(c *gin.Context, userID uuid.UUID, handler MessageHandler) {
	conn, err := Upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		logrus.WithError(err).Error("Failed to upgrade WebSocket connection")
		return
	}

	client := &Client{
		ID:     uuid.New().String(),
		UserID: userID,
		Conn:   conn,
		Send:   make(chan []byte, 256),
	}

	m.register <- client

	// Start goroutines for reading and writing
	go m.WritePump(client)
	go m.ReadPump(client, handler)
}
