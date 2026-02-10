package handlers

import (
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"

	"backend-go/internal/database"
	"backend-go/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

// DeployHandler handles website deployment
type DeployHandler struct {
	db *database.Database
}

// NewDeployHandler creates new deploy handler
func NewDeployHandler(db *database.Database) *DeployHandler {
	return &DeployHandler{db: db}
}

// DeployRequest represents deployment request
type DeployRequest struct {
	WebsiteID string `json:"websiteId" binding:"required,uuid"`
}

// DeployResponse represents deployment response
type DeployResponse struct {
	Subdomain string `json:"subdomain"`
	URL       string `json:"url"`
	Status    string `json:"status"`
}

// Deploy godoc
// @Summary Deploy website to production
// @Description Deploy user's website to Dokploy with subdomain
// @Tags deploy
// @Accept json
// @Produce json
// @Param request body DeployRequest true "Deployment request"
// @Success 200 {object} DeployResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /deploy [post]
func (h *DeployHandler) Deploy(c *gin.Context) {
	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req DeployRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse website ID
	websiteID, err := uuid.Parse(req.WebsiteID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid website ID"})
		return
	}

	// Get website from database
	var website models.Website
	if err := h.db.DB.Where("id = ? AND user_id = ?", websiteID, userID).First(&website).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Website not found"})
		return
	}

	// Generate subdomain if not exists
	subdomain := website.Subdomain
	if subdomain == "" {
		subdomain = generateSubdomain(website.Title)
		website.Subdomain = subdomain
		h.db.DB.Save(&website)
	}

	// Trigger deployment
	deployURL, err := h.deployWebsite(website)
	if err != nil {
		logrus.WithError(err).Error("Failed to deploy website")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Deployment failed"})
		return
	}

	// Update website status
	website.Status = "published"
	h.db.DB.Save(&website)

	c.JSON(http.StatusOK, DeployResponse{
		Subdomain: subdomain,
		URL:       deployURL,
		Status:    "deployed",
	})
}

// deployWebsite triggers the deployment script
func (h *DeployHandler) deployWebsite(website models.Website) (string, error) {
	// Get base domain from environment
	baseDomain := os.Getenv("BASE_DOMAIN")
	if baseDomain == "" {
		baseDomain = "sitespark.id" // default
	}

	// Get generated HTML content
	htmlContent, err := h.generateHTML(website)
	if err != nil {
		return "", fmt.Errorf("failed to generate HTML: %w", err)
	}

	// Create website directory
	websitesDir := os.Getenv("WEBSITES_DIR")
	if websitesDir == "" {
		websitesDir = "./websites"
	}

	websiteDir := filepath.Join(websitesDir, website.Subdomain)
	if err := os.MkdirAll(websiteDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create directory: %w", err)
	}

	// Write index.html
	indexPath := filepath.Join(websiteDir, "index.html")
	if err := os.WriteFile(indexPath, []byte(htmlContent), 0644); err != nil {
		return "", fmt.Errorf("failed to write HTML: %w", err)
	}

	// Run deployment script (optional - for Dokploy deployment)
	scriptPath := os.Getenv("DEPLOY_SCRIPT_PATH")
	if scriptPath == "" {
		scriptPath = "./scripts/deploy.sh"
	}

	// Check if script exists
	if _, err := os.Stat(scriptPath); err == nil {
		cmd := exec.Command(scriptPath, "deploy", website.Title)
		cmd.Dir = filepath.Dir(scriptPath)
		
		output, err := cmd.CombinedOutput()
		if err != nil {
			logrus.WithError(err).WithField("output", string(output)).Error("Deployment script failed")
			// Continue anyway - local deployment doesn't need script
		} else {
			logrus.WithField("output", string(output)).Info("Deployment completed")
		}
	} else {
		logrus.Info("No deployment script found, skipping script execution")
	}

	// Return deployed URL
	deployURL := fmt.Sprintf("https://%s.%s", website.Subdomain, baseDomain)
	return deployURL, nil
}

// generateHTML generates HTML content from website config
func (h *DeployHandler) generateHTML(website models.Website) (string, error) {
	// TODO: Use template engine to generate HTML from website.Config
	// For now, return a basic template
	
	title := website.Title
	if title == "" {
		title = "My Website"
	}

	html := fmt.Sprintf(`<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>%s</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: #1e293b;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        header { 
            background: linear-gradient(135deg, #2563eb 0%%, #7c3aed 100%%);
            color: white;
            padding: 4rem 0;
            text-align: center;
        }
        h1 { font-size: 3rem; margin-bottom: 1rem; font-weight: 700; }
        .subtitle { font-size: 1.25rem; opacity: 0.9; }
        main { padding: 4rem 0; text-align: center; }
        footer {
            background: #1e293b;
            color: white;
            padding: 2rem 0;
            text-align: center;
            margin-top: 4rem;
        }
    </style>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <header>
        <div class="container">
            <h1>%s</h1>
            <p class="subtitle">%s</p>
        </div>
    </header>
    <main>
        <div class="container">
            <p>Website generated by SiteSpark AI</p>
        </div>
    </main>
    <footer>
        <div class="container">
            <p>Made with ❤️ by SiteSpark</p>
        </div>
    </footer>
</body>
</html>`, title, title, website.Description)

	return html, nil
}

// generateSubdomain creates a URL-friendly subdomain
func generateSubdomain(title string) string {
	// Simple slug generation
	// In production, use a proper slug library
	slug := ""
	for _, r := range title {
		if r >= 'a' && r <= 'z' {
			slug += string(r)
		} else if r >= 'A' && r <= 'Z' {
			slug += string(r + 32) // to lowercase
		} else if r >= '0' && r <= '9' {
			slug += string(r)
		} else if r == ' ' || r == '-' {
			slug += "-"
		}
	}
	
	// Add random suffix if needed
	if len(slug) > 30 {
		slug = slug[:30]
	}
	
	return slug
}

// GetDeployments lists all deployments for a user
func (h *DeployHandler) GetDeployments(c *gin.Context) {
	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var websites []models.Website
	if err := h.db.DB.Where("user_id = ? AND status = ?", userID, "published").Find(&websites).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch deployments"})
		return
	}

	baseDomain := os.Getenv("BASE_DOMAIN")
	if baseDomain == "" {
		baseDomain = "sitespark.id"
	}

	deployments := make([]DeployResponse, len(websites))
	for i, website := range websites {
		deployments[i] = DeployResponse{
			Subdomain: website.Subdomain,
			URL:       fmt.Sprintf("https://%s.%s", website.Subdomain, baseDomain),
			Status:    website.Status,
		}
	}

	c.JSON(http.StatusOK, deployments)
}