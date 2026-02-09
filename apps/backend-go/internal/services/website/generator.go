package website

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"backend-go/internal/database"
	"backend-go/internal/models"
	"backend-go/internal/services/ai"
	"backend-go/internal/services/token"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type Generator struct {
	db          *database.Database
	kimi        *ai.KimiClient
	tokenMgr    *token.Manager
}

func NewGenerator(db *database.Database, kimi *ai.KimiClient, tokenMgr *token.Manager) *Generator {
	return &Generator{
		db:       db,
		kimi:     kimi,
		tokenMgr: tokenMgr,
	}
}

type GenerateRequest struct {
	UserID     uuid.UUID
	Prompt     string
	TemplateID string
	Subdomain  string
}

type GenerateResult struct {
	Website *models.Website
	TokensUsed int
}

func (g *Generator) Generate(ctx context.Context, req GenerateRequest) (*GenerateResult, error) {
	const websiteGenCost = 50

	// Check and deduct tokens
	hasTokens, err := g.tokenMgr.HasEnoughTokens(req.UserID, websiteGenCost)
	if err != nil {
		return nil, fmt.Errorf("failed to check token balance: %w", err)
	}
	if !hasTokens {
		return nil, fmt.Errorf("insufficient tokens: need %d", websiteGenCost)
	}

	// Generate website content via AI
	content, err := g.kimi.GenerateWebsite(ctx, req.Prompt, req.TemplateID)
	if err != nil {
		return nil, fmt.Errorf("AI generation failed: %w", err)
	}

	// Parse the generated content
	var generatedData map[string]interface{}
	if err := json.Unmarshal([]byte(content), &generatedData); err != nil {
		// Try to extract JSON from markdown code block
		content = extractJSON(content)
		if err := json.Unmarshal([]byte(content), &generatedData); err != nil {
			logrus.WithError(err).WithField("content", content).Warn("Failed to parse AI response as JSON")
			// Use raw content as fallback
			generatedData = map[string]interface{}{
				"rawContent": content,
			}
		}
	}

	// Extract title and description
	title := getString(generatedData, "title", "My Website")
	description := getString(generatedData, "description", "")

	// Generate design tokens based on template
	designTokens := g.generateDesignTokens(req.TemplateID)

	// Create website
	website := &models.Website{
		UserID:           req.UserID,
		Subdomain:        req.Subdomain,
		Title:            title,
		Description:      description,
		TemplateID:       req.TemplateID,
		Status:           "draft",
		Config:           datatypes.JSON(`{}`),
		DesignTokens:     designTokens,
		GeneratedContent: datatypes.JSON(content),
	}

	// Transaction: create website and deduct tokens
	err = g.db.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(website).Error; err != nil {
			return err
		}

		_, err := g.tokenMgr.DeductTokensTx(tx, req.UserID, websiteGenCost, "website_generation", 
			fmt.Sprintf("Generated website: %s", title), &website.ID)
		if err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("transaction failed: %w", err)
	}

	return &GenerateResult{
		Website:    website,
		TokensUsed: websiteGenCost,
	}, nil
}

func (g *Generator) generateDesignTokens(templateID string) datatypes.JSON {
	tokens := map[string]interface{}{
		"colors": map[string]string{
			"primary":   "#3B82F6",
			"secondary": "#10B981",
			"accent":    "#F59E0B",
			"background": "#FFFFFF",
			"text":      "#1F2937",
		},
		"typography": map[string]string{
			"headingFont": "Inter",
			"bodyFont":    "Inter",
		},
		"spacing": map[string]string{
			"small":  "1rem",
			"medium": "2rem",
			"large":  "4rem",
		},
		"borderRadius": "0.5rem",
	}

	// Customize based on template
	switch templateID {
	case "modern":
		tokens["colors"].(map[string]string)["primary"] = "#6366F1"
		tokens["borderRadius"] = "1rem"
	case "minimal":
		tokens["colors"].(map[string]string)["primary"] = "#000000"
		tokens["colors"].(map[string]string)["background"] = "#FAFAFA"
		tokens["borderRadius"] = "0"
	case "creative":
		tokens["colors"].(map[string]string)["primary"] = "#EC4899"
		tokens["colors"].(map[string]string)["secondary"] = "#8B5CF6"
		tokens["typography"].(map[string]string)["headingFont"] = "Poppins"
	}

	jsonBytes, _ := json.Marshal(tokens)
	return datatypes.JSON(jsonBytes)
}

func extractJSON(content string) string {
	// Extract JSON from markdown code blocks
	start := strings.Index(content, "```json")
	if start != -1 {
		start += 7
		end := strings.Index(content[start:], "```")
		if end != -1 {
			return strings.TrimSpace(content[start : start+end])
		}
	}
	
	// Try plain code block
	start = strings.Index(content, "```")
	if start != -1 {
		start += 3
		end := strings.Index(content[start:], "```")
		if end != -1 {
			return strings.TrimSpace(content[start : start+end])
		}
	}
	
	return content
}

func getString(m map[string]interface{}, key, defaultValue string) string {
	if v, ok := m[key]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return defaultValue
}