package handlers

import (
	"encoding/json"
	"fmt"
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

// Preview serves the generated website as HTML for preview
func (h *WebsiteHandler) Preview(c *gin.Context) {
	id := c.Param("id")
	websiteID, err := uuid.Parse(id)
	if err != nil {
		c.String(http.StatusBadRequest, "Invalid website ID")
		return
	}

	var website models.Website
	if err := h.db.DB.First(&website, "id = ?", websiteID).Error; err != nil {
		c.String(http.StatusNotFound, "Website not found")
		return
	}

	// Generate HTML from the website content
	html := h.generatePreviewHTML(&website)
	c.Header("Content-Type", "text/html; charset=utf-8")
	c.String(http.StatusOK, html)
}

func (h *WebsiteHandler) generatePreviewHTML(website *models.Website) string {
	title := website.Title
	if title == "" {
		title = "My Website"
	}

	// Parse generated content if available
	var content map[string]interface{}
	if website.GeneratedContent != nil {
		if err := json.Unmarshal(website.GeneratedContent, &content); err != nil {
			content = map[string]interface{}{}
		}
	}

	description, _ := content["description"].(string)
	sections, _ := content["sections"].([]interface{})

	// Build sections HTML
	sectionsHTML := ""
	for _, section := range sections {
		if secMap, ok := section.(map[string]interface{}); ok {
			secType, _ := secMap["type"].(string)
			secContent, _ := secMap["content"].(map[string]interface{})
			sectionsHTML += h.renderSection(secType, secContent)
		}
	}

	// Default content if no sections
	if sectionsHTML == "" {
		sectionsHTML = fmt.Sprintf(`
			<section style="padding: 4rem 2rem; text-align: center; background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white;">
				<h1 style="font-size: 3rem; margin-bottom: 1rem;">%s</h1>
				<p style="font-size: 1.25rem; opacity: 0.9;">%s</p>
			</section>
			<section style="padding: 4rem 2rem; max-width: 1200px; margin: 0 auto;">
				<h2 style="text-align: center; margin-bottom: 2rem;">Welcome</h2>
				<p style="text-align: center; color: #666;">Your website is being generated. Check back soon!</p>
			</section>
		`, title, description)
	}

	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>%s</title>
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
		.container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
		section { padding: 4rem 0; }
	</style>
</head>
<body>
	%s
	<footer style="background: #1a1a1a; color: white; padding: 2rem; text-align: center;">
		<p>&copy; 2026 %s. All rights reserved.</p>
	</footer>
</body>
</html>`, title, sectionsHTML, title)
}

func (h *WebsiteHandler) renderSection(secType string, content map[string]interface{}) string {
	switch secType {
	case "hero":
		title, _ := content["title"].(string)
		subtitle, _ := content["subtitle"].(string)
		return fmt.Sprintf(`
			<section style="padding: 6rem 2rem; text-align: center; background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white;">
				<div class="container">
					<h1 style="font-size: 3.5rem; margin-bottom: 1rem; font-weight: 700;">%s</h1>
					<p style="font-size: 1.5rem; opacity: 0.9; max-width: 600px; margin: 0 auto;">%s</p>
				</div>
			</section>
		`, title, subtitle)
	case "about":
		title, _ := content["title"].(string)
		text, _ := content["text"].(string)
		return fmt.Sprintf(`
			<section style="padding: 4rem 2rem; background: #f8f9fa;">
				<div class="container">
					<h2 style="text-align: center; margin-bottom: 2rem; font-size: 2.5rem;">%s</h2>
					<p style="max-width: 800px; margin: 0 auto; text-align: center; font-size: 1.1rem; color: #555;">%s</p>
				</div>
			</section>
		`, title, text)
	case "services":
		title, _ := content["title"].(string)
		items, _ := content["items"].([]interface{})
		itemsHTML := ""
		for _, item := range items {
			if itemMap, ok := item.(map[string]interface{}); ok {
				itemTitle, _ := itemMap["title"].(string)
				itemDesc, _ := itemMap["description"].(string)
				itemsHTML += fmt.Sprintf(`
					<div style="padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
						<h3 style="margin-bottom: 1rem; color: #667eea;">%s</h3>
						<p style="color: #666;">%s</p>
					</div>
				`, itemTitle, itemDesc)
			}
		}
		return fmt.Sprintf(`
			<section style="padding: 4rem 2rem;">
				<div class="container">
					<h2 style="text-align: center; margin-bottom: 3rem; font-size: 2.5rem;">%s</h2>
					<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
						%s
					</div>
				</div>
			</section>
		`, title, itemsHTML)
	case "contact":
		title, _ := content["title"].(string)
		email, _ := content["email"].(string)
		phone, _ := content["phone"].(string)
		return fmt.Sprintf(`
			<section style="padding: 4rem 2rem; background: #f8f9fa;">
				<div class="container" style="text-align: center;">
					<h2 style="margin-bottom: 2rem; font-size: 2.5rem;">%s</h2>
					<p style="margin-bottom: 1rem;">Email: %s</p>
					<p>Phone: %s</p>
				</div>
			</section>
		`, title, email, phone)
	default:
		return ""
	}
}