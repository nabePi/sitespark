package handlers

import (
	"net/http"
	"strings"

	"backend-go/internal/database"
	"backend-go/internal/models"
	"backend-go/internal/services/website"
	"backend-go/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type WebsiteHandler struct {
	db        *database.Database
	generator *website.Generator
	validate  *validator.Validate
}

func NewWebsiteHandler(db *database.Database, generator *website.Generator) *WebsiteHandler {
	return &WebsiteHandler{
		db:        db,
		generator: generator,
		validate:  validator.New(),
	}
}

type CreateWebsiteRequest struct {
	Title       string          `json:"title" validate:"required"`
	Description string          `json:"description"`
	Subdomain   string          `json:"subdomain" validate:"required"`
	TemplateID  string          `json:"templateId" validate:"required"`
	Config      datatypes.JSON  `json:"config"`
}

type UpdateWebsiteRequest struct {
	Title       string         `json:"title"`
	Description string         `json:"description"`
	CustomDomain string        `json:"customDomain"`
	Config      datatypes.JSON `json:"config"`
	DesignTokens datatypes.JSON `json:"designTokens"`
	Status      string         `json:"status"`
}

func (h *WebsiteHandler) List(c *gin.Context) {
	userID, exists := c.Get("userId")
	if !exists {
		utils.Unauthorized(c, "User not authenticated")
		return
	}

	var websites []models.Website
	if err := h.db.DB.Where("user_id = ?", userID.(uuid.UUID)).
		Order("created_at DESC").
		Find(&websites).Error; err != nil {
		utils.InternalError(c)
		return
	}

	responses := make([]map[string]interface{}, len(websites))
	for i, w := range websites {
		responses[i] = w.Response()
	}

	utils.JSONSuccess(c, http.StatusOK, gin.H{
		"websites": responses,
	})
}

func (h *WebsiteHandler) Get(c *gin.Context) {
	userID, exists := c.Get("userId")
	if !exists {
		utils.Unauthorized(c, "User not authenticated")
		return
	}

	id := c.Param("id")
	websiteID, err := uuid.Parse(id)
	if err != nil {
		utils.BadRequest(c, "Invalid website ID")
		return
	}

	var w models.Website
	if err := h.db.DB.Where("id = ? AND user_id = ?", websiteID, userID.(uuid.UUID)).First(&w).Error; err != nil {
		utils.NotFound(c, "Website not found")
		return
	}

	utils.JSONSuccess(c, http.StatusOK, w.Response())
}

func (h *WebsiteHandler) Create(c *gin.Context) {
	userID, exists := c.Get("userId")
	if !exists {
		utils.Unauthorized(c, "User not authenticated")
		return
	}

	var req CreateWebsiteRequest
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

	// Check subdomain availability
	var existing models.Website
	if err := h.db.DB.Where("subdomain = ?", subdomain).First(&existing).Error; err == nil {
		utils.Conflict(c, "Subdomain already taken")
		return
	}

	website := &models.Website{
		UserID:      userID.(uuid.UUID),
		Subdomain:   subdomain,
		Title:       req.Title,
		Description: req.Description,
		TemplateID:  req.TemplateID,
		Status:      "draft",
		Config:      req.Config,
	}

	if website.Config == nil {
		website.Config = datatypes.JSON(`{}`)
	}

	if err := h.db.DB.Create(website).Error; err != nil {
		utils.InternalError(c)
		return
	}

	utils.JSONSuccess(c, http.StatusCreated, website.Response())
}

func (h *WebsiteHandler) Update(c *gin.Context) {
	userID, exists := c.Get("userId")
	if !exists {
		utils.Unauthorized(c, "User not authenticated")
		return
	}

	id := c.Param("id")
	websiteID, err := uuid.Parse(id)
	if err != nil {
		utils.BadRequest(c, "Invalid website ID")
		return
	}

	var req UpdateWebsiteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, "Invalid request body")
		return
	}

	var website models.Website
	if err := h.db.DB.Where("id = ? AND user_id = ?", websiteID, userID.(uuid.UUID)).First(&website).Error; err != nil {
		utils.NotFound(c, "Website not found")
		return
	}

	updates := map[string]interface{}{}
	if req.Title != "" {
		updates["title"] = req.Title
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.CustomDomain != "" {
		updates["custom_domain"] = req.CustomDomain
	}
	if req.Status != "" {
		updates["status"] = req.Status
		if req.Status == "published" {
			updates["published_at"] = gorm.Expr("NOW()")
		}
	}
	if req.Config != nil {
		updates["config"] = req.Config
	}
	if req.DesignTokens != nil {
		updates["design_tokens"] = req.DesignTokens
	}

	if err := h.db.DB.Model(&website).Updates(updates).Error; err != nil {
		utils.InternalError(c)
		return
	}

	// Reload
	h.db.DB.First(&website, "id = ?", websiteID)

	utils.JSONSuccess(c, http.StatusOK, website.Response())
}

func (h *WebsiteHandler) Delete(c *gin.Context) {
	userID, exists := c.Get("userId")
	if !exists {
		utils.Unauthorized(c, "User not authenticated")
		return
	}

	id := c.Param("id")
	websiteID, err := uuid.Parse(id)
	if err != nil {
		utils.BadRequest(c, "Invalid website ID")
		return
	}

	var website models.Website
	if err := h.db.DB.Where("id = ? AND user_id = ?", websiteID, userID.(uuid.UUID)).First(&website).Error; err != nil {
		utils.NotFound(c, "Website not found")
		return
	}

	if err := h.db.DB.Delete(&website).Error; err != nil {
		utils.InternalError(c)
		return
	}

	utils.JSONSuccess(c, http.StatusOK, gin.H{"deleted": true})
}