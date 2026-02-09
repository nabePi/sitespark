package handlers

import (
	"net/http"
	"strconv"

	"backend-go/internal/database"
	"backend-go/internal/services/token"
	"backend-go/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type TokenHandler struct {
	db       *database.Database
	tokenMgr *token.Manager
}

func NewTokenHandler(db *database.Database, tokenMgr *token.Manager) *TokenHandler {
	return &TokenHandler{
		db:       db,
		tokenMgr: tokenMgr,
	}
}

func (h *TokenHandler) GetBalance(c *gin.Context) {
	userID, exists := c.Get("userId")
	if !exists {
		utils.Unauthorized(c, "User not authenticated")
		return
	}

	balance, err := h.tokenMgr.GetBalance(userID.(uuid.UUID))
	if err != nil {
		utils.InternalError(c)
		return
	}

	utils.JSONSuccess(c, http.StatusOK, gin.H{
		"balance": balance,
	})
}

func (h *TokenHandler) GetTransactions(c *gin.Context) {
	userID, exists := c.Get("userId")
	if !exists {
		utils.Unauthorized(c, "User not authenticated")
		return
	}

	limit := 20
	offset := 0

	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	if o := c.Query("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	transactions, total, err := h.tokenMgr.GetTransactions(userID.(uuid.UUID), limit, offset)
	if err != nil {
		utils.InternalError(c)
		return
	}

	responses := make([]map[string]interface{}, len(transactions))
	for i, t := range transactions {
		responses[i] = t.Response()
	}

	utils.JSONSuccess(c, http.StatusOK, gin.H{
		"transactions": responses,
		"total":        total,
		"limit":        limit,
		"offset":       offset,
	})
}

func (h *TokenHandler) ClaimDailyBonus(c *gin.Context) {
	userID, exists := c.Get("userId")
	if !exists {
		utils.Unauthorized(c, "User not authenticated")
		return
	}

	transaction, err := h.tokenMgr.AwardDailyLogin(userID.(uuid.UUID))
	if err != nil {
		utils.JSONError(c, http.StatusBadRequest, "BONUS_ALREADY_CLAIMED", err.Error())
		return
	}

	utils.JSONSuccess(c, http.StatusOK, gin.H{
		"transaction": transaction.Response(),
	})
}