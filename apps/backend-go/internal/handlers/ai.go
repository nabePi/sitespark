package handlers

import (
	"net/http"
	"strings"

	"backend-go/internal/database"
	"backend-go/internal/services/ai"
	"backend-go/internal/services/website"
	"backend-go/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

type AIHandler struct {
	db        *database.Database
	kimi      *ai.KimiClient
	generator *website.Generator
	validate  *validator.Validate
}

func NewAIHandler(db *database.Database, kimi *ai.KimiClient, generator *website.Generator) *AIHandler {
	return &AIHandler{
		db:        db,
		kimi:      kimi,
		generator: generator,
		validate:  validator.New(),
	}
}

type GenerateRequest struct {
	Prompt     string `json:"prompt" validate:"required,min=10"`
	TemplateID string `json:"templateId" validate:"required"`
	Subdomain  string `json:"subdomain" validate:"required"`
}

type ChatRequest struct {
	Messages []ai.Message `json:"messages" validate:"required,min=1"`
}

func (h *AIHandler) Generate(c *gin.Context) {
	userID, exists := c.Get("userId")
	if !exists {
		utils.Unauthorized(c, "User not authenticated")
		return
	}

	var req GenerateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, "Invalid request body")
		return
	}

	if err := h.validate.Struct(req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// Normalize subdomain
	subdomain := strings.ToLower(strings.TrimSpace(req.Subdomain))
	subdomain = strings.ReplaceAll(subdomain, " ", "-")

	result, err := h.generator.Generate(c.Request.Context(), website.GenerateRequest{
		UserID:     userID.(uuid.UUID),
		Prompt:     req.Prompt,
		TemplateID: req.TemplateID,
		Subdomain:  subdomain,
	})

	if err != nil {
		logrus.WithError(err).Error("Website generation failed")
		if err.Error() == "insufficient tokens" || strings.Contains(err.Error(), "insufficient") {
			utils.InsufficientTokens(c)
			return
		}
		utils.JSONError(c, http.StatusBadRequest, "GENERATION_FAILED", err.Error())
		return
	}

	utils.JSONSuccess(c, http.StatusCreated, gin.H{
		"website":    result.Website.Response(),
		"tokensUsed": result.TokensUsed,
	})
}

func (h *AIHandler) Chat(c *gin.Context) {
	var req ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, "Invalid request body")
		return
	}

	if err := h.validate.Struct(req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	response, err := h.kimi.Chat(c.Request.Context(), req.Messages)
	if err != nil {
		utils.JSONError(c, http.StatusServiceUnavailable, "AI_UNAVAILABLE", err.Error())
		return
	}

	utils.JSONSuccess(c, http.StatusOK, gin.H{
		"message": response,
	})
}