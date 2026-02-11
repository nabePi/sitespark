package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"backend-go/internal/database"
	"backend-go/internal/models"
	"backend-go/internal/services/ai"
	"backend-go/internal/utils"
	"backend-go/internal/websocket"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

// WebSocketHandler handles WebSocket connections
type WebSocketHandler struct {
	manager   *websocket.Manager
	jwtUtil   *utils.JWTUtil
	db        *database.Database
	kimi      *ai.KimiClient
	chatHistory map[string][]ai.Message // In-memory chat history per user (can be moved to Redis)
}

// NewWebSocketHandler creates a new WebSocket handler
func NewWebSocketHandler(manager *websocket.Manager, jwtUtil *utils.JWTUtil, db *database.Database, kimi *ai.KimiClient) *WebSocketHandler {
	return &WebSocketHandler{
		manager:     manager,
		jwtUtil:     jwtUtil,
		db:          db,
		kimi:        kimi,
		chatHistory: make(map[string][]ai.Message),
	}
}

// HandleWebSocket handles WebSocket upgrade requests
func (h *WebSocketHandler) HandleWebSocket(c *gin.Context) {
	// Get token from query parameter
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Token required"})
		return
	}

	// Validate JWT token
	claims, err := h.jwtUtil.ValidateToken(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

	// Upgrade connection
	h.manager.HandleWebSocket(c, claims.UserID, h.handleMessage)
}

// handleMessage processes incoming WebSocket messages
func (h *WebSocketHandler) handleMessage(client *websocket.Client, msg websocket.Message) {
	logrus.WithFields(logrus.Fields{
		"type":   msg.Type,
		"userId": client.UserID,
		"content": msg.Content,
	}).Info("Received WebSocket message")

	switch msg.Type {
	case websocket.MessageTypeChatMessage:
		h.handleChatMessage(client, msg)
	case websocket.MessageTypeChatTyping:
		h.handleTypingIndicator(client, msg)
	case websocket.MessageTypeWebsiteJoin:
		h.handleWebsiteJoin(client, msg)
	case websocket.MessageTypeWebsiteLeave:
		h.handleWebsiteLeave(client, msg)
	default:
		// Unknown message type
		h.sendError(client, "Unknown message type")
	}
}

// handleChatMessage processes chat messages and streams AI responses
func (h *WebSocketHandler) handleChatMessage(client *websocket.Client, msg websocket.Message) {
	logrus.WithField("content", msg.Content).Info("Handling chat message")

	if msg.Content == "" {
		h.sendError(client, "Message content is required")
		return
	}

	userID := client.UserID.String()

	// Initialize chat history for user if not exists
	if _, ok := h.chatHistory[userID]; !ok {
		h.chatHistory[userID] = []ai.Message{
			{Role: "system", Content: "You are a helpful AI assistant for SiteSpark, an AI-powered website builder. Help users create and improve their websites."},
		}
	}

	// Add user message to history
	h.chatHistory[userID] = append(h.chatHistory[userID], ai.Message{
		Role:    "user",
		Content: msg.Content,
	})

	// Limit history to last 20 messages to prevent context overflow
	if len(h.chatHistory[userID]) > 20 {
		h.chatHistory[userID] = h.chatHistory[userID][len(h.chatHistory[userID])-20:]
	}

	// Send acknowledgment that message was received
	ackMsg := websocket.Message{
		Type:      websocket.MessageTypeChatMessage,
		ID:        uuid.New().String(),
		Role:      "user",
		Content:   msg.Content,
		Timestamp: time.Now(),
	}
	h.sendToClient(client, ackMsg)

	// Stream AI response
	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()

	var fullResponse string
	messageID := uuid.New().String()

	err := h.kimi.ChatCompletionStream(ctx, h.chatHistory[userID], func(chunk string) {
		fullResponse += chunk
		streamMsg := websocket.Message{
			Type:      websocket.MessageTypeChatStream,
			ID:        messageID,
			Chunk:     chunk,
			Timestamp: time.Now(),
		}
		h.sendToClient(client, streamMsg)
	})

	if err != nil {
		logrus.WithError(err).Error("Failed to get AI streaming response")
		h.sendError(client, "Failed to get AI response")
		return
	}

	// Add assistant response to history
	h.chatHistory[userID] = append(h.chatHistory[userID], ai.Message{
		Role:    "assistant",
		Content: fullResponse,
	})

	// Send final message confirmation
	finalMsg := websocket.Message{
		Type:      websocket.MessageTypeChatMessage,
		ID:        messageID,
		Role:      "assistant",
		Content:   fullResponse,
		Timestamp: time.Now(),
	}
	h.sendToClient(client, finalMsg)

	// Save chat message to database if user is authenticated
	if msg.WebsiteID != "" {
		websiteID, err := uuid.Parse(msg.WebsiteID)
		if err == nil {
			h.saveChatMessage(client.UserID, &websiteID, "user", msg.Content)
			h.saveChatMessage(client.UserID, &websiteID, "assistant", fullResponse)
		}
	} else {
		h.saveChatMessage(client.UserID, nil, "user", msg.Content)
		h.saveChatMessage(client.UserID, nil, "assistant", fullResponse)
	}
}

// handleTypingIndicator broadcasts typing status
func (h *WebSocketHandler) handleTypingIndicator(client *websocket.Client, msg websocket.Message) {
	// Broadcast typing indicator to all clients (or specific website room if implemented)
	typingMsg := websocket.Message{
		Type:      websocket.MessageTypeChatTyping,
		UserID:    client.UserID.String(),
		IsTyping:  msg.IsTyping,
		Timestamp: time.Now(),
	}

	// For now, just echo back to sender (in a multi-user scenario, broadcast to room)
	h.sendToClient(client, typingMsg)
}

// handleWebsiteJoin handles joining a website chat room
func (h *WebSocketHandler) handleWebsiteJoin(client *websocket.Client, msg websocket.Message) {
	if msg.WebsiteID == "" {
		h.sendError(client, "Website ID is required")
		return
	}

	// Verify user has access to this website
	websiteID, err := uuid.Parse(msg.WebsiteID)
	if err != nil {
		h.sendError(client, "Invalid website ID")
		return
	}

	var website models.Website
	if err := h.db.GetDB().Where("id = ? AND user_id = ?", websiteID, client.UserID).First(&website).Error; err != nil {
		h.sendError(client, "Website not found or access denied")
		return
	}

	// Send confirmation
	joinMsg := websocket.Message{
		Type:      websocket.MessageTypeWebsiteJoin,
		WebsiteID: msg.WebsiteID,
		Timestamp: time.Now(),
	}
	h.sendToClient(client, joinMsg)
}

// handleWebsiteLeave handles leaving a website chat room
func (h *WebSocketHandler) handleWebsiteLeave(client *websocket.Client, msg websocket.Message) {
	leaveMsg := websocket.Message{
		Type:      websocket.MessageTypeWebsiteLeave,
		WebsiteID: msg.WebsiteID,
		Timestamp: time.Now(),
	}
	h.sendToClient(client, leaveMsg)
}

// sendToClient sends a message to a specific client
func (h *WebSocketHandler) sendToClient(client *websocket.Client, msg websocket.Message) {
	logrus.WithField("type", msg.Type).Info("Sending message to client")
	data, err := json.Marshal(msg)
	if err != nil {
		logrus.WithError(err).Error("Failed to marshal message")
		return
	}
	client.SendMessage(data)
}

// sendError sends an error message to a client
func (h *WebSocketHandler) sendError(client *websocket.Client, errorMsg string) {
	msg := websocket.Message{
		Type:      websocket.MessageTypeError,
		Error:     errorMsg,
		Timestamp: time.Now(),
	}
	h.sendToClient(client, msg)
}

// saveChatMessage saves a chat message to the database
func (h *WebSocketHandler) saveChatMessage(userID uuid.UUID, websiteID *uuid.UUID, role, content string) {
	// This can be made async to not block the WebSocket
	go func() {
		chatMsg := models.ChatMessage{
			UserID:    userID,
			WebsiteID: websiteID,
			Role:      role,
			Content:   content,
		}

		if err := h.db.GetDB().Create(&chatMsg).Error; err != nil {
			logrus.WithError(err).Error("Failed to save chat message")
		}
	}()
}
