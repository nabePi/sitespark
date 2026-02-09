package handlers

import (
	"net/http"

	"backend-go/internal/database"
	"backend-go/internal/models"
	"backend-go/internal/services/token"
	"backend-go/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthHandler struct {
	db       *database.Database
	jwtUtil  *utils.JWTUtil
	tokenMgr *token.Manager
	validate *validator.Validate
}

func NewAuthHandler(db *database.Database, jwtUtil *utils.JWTUtil, tokenMgr *token.Manager) *AuthHandler {
	return &AuthHandler{
		db:       db,
		jwtUtil:  jwtUtil,
		tokenMgr: tokenMgr,
		validate: validator.New(),
	}
}

type RegisterRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
	Name     string `json:"name"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type AuthResponse struct {
	User        interface{} `json:"user"`
	AccessToken string      `json:"accessToken"`
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, "Invalid request body")
		return
	}

	if err := h.validate.Struct(req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// Check if email exists
	var existingUser models.User
	if err := h.db.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		utils.Conflict(c, "Email already registered")
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		utils.InternalError(c)
		return
	}

	// Create user with transaction for signup bonus
	user := &models.User{
		Email:    req.Email,
		Password: string(hashedPassword),
		Name:     req.Name,
	}

	err = h.db.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(user).Error; err != nil {
			return err
		}
		// Award signup bonus
		_, err := h.tokenMgr.AddTokensTx(tx, user.ID, 100, token.TypeSignupBonus, "Welcome bonus for signing up", nil)
		return err
	})

	if err != nil {
		utils.InternalError(c)
		return
	}

	// Generate token
	tokenString, err := h.jwtUtil.GenerateToken(user.ID, user.Email)
	if err != nil {
		utils.InternalError(c)
		return
	}

	// Reload user to get updated balance
	h.db.DB.First(user, "id = ?", user.ID)

	utils.JSONSuccess(c, http.StatusCreated, AuthResponse{
		User:        user.Response(),
		AccessToken: tokenString,
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, "Invalid request body")
		return
	}

	if err := h.validate.Struct(req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// Find user
	var user models.User
	if err := h.db.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		utils.Unauthorized(c, "Invalid email or password")
		return
	}

	// Check password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		utils.Unauthorized(c, "Invalid email or password")
		return
	}

	// Generate token
	tokenString, err := h.jwtUtil.GenerateToken(user.ID, user.Email)
	if err != nil {
		utils.InternalError(c)
		return
	}

	utils.JSONSuccess(c, http.StatusOK, AuthResponse{
		User:        user.Response(),
		AccessToken: tokenString,
	})
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	var req struct {
		Token string `json:"token"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, "Token required")
		return
	}

	newToken, err := h.jwtUtil.RefreshToken(req.Token)
	if err != nil {
		utils.Unauthorized(c, "Invalid token")
		return
	}

	utils.JSONSuccess(c, http.StatusOK, gin.H{
		"accessToken": newToken,
	})
}

func (h *AuthHandler) Me(c *gin.Context) {
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