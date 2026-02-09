package handlers

import (
	"net/http"

	"backend-go/internal/database"
	"backend-go/internal/models"
	"backend-go/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

type UserHandler struct {
	db       *database.Database
	validate *validator.Validate
}

func NewUserHandler(db *database.Database) *UserHandler {
	return &UserHandler{
		db:       db,
		validate: validator.New(),
	}
}

type UpdateProfileRequest struct {
	Name      string `json:"name"`
	AvatarURL string `json:"avatarUrl"`
}

func (h *UserHandler) GetProfile(c *gin.Context) {
	userID, exists := c.Get("userId")
	if !exists {
		utils.Unauthorized(c, "User not authenticated")
		return
	}

	var user models.User
	if err := h.db.DB.First(&user, "id = ?", userID.(uuid.UUID)).Error; err != nil {
		utils.NotFound(c, "User not found")
		return
	}

	utils.JSONSuccess(c, http.StatusOK, user.Response())
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("userId")
	if !exists {
		utils.Unauthorized(c, "User not authenticated")
		return
	}

	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, "Invalid request body")
		return
	}

	var user models.User
	if err := h.db.DB.First(&user, "id = ?", userID.(uuid.UUID)).Error; err != nil {
		utils.NotFound(c, "User not found")
		return
	}

	updates := map[string]interface{}{}
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.AvatarURL != "" {
		updates["avatar_url"] = req.AvatarURL
	}

	if err := h.db.DB.Model(&user).Updates(updates).Error; err != nil {
		utils.InternalError(c)
		return
	}

	// Reload user
	h.db.DB.First(&user, "id = ?", userID.(uuid.UUID))

	utils.JSONSuccess(c, http.StatusOK, user.Response())
}