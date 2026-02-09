package token

import (
	"fmt"
	"time"

	"backend-go/internal/database"
	"backend-go/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Manager struct {
	db *database.Database
}

func NewManager(db *database.Database) *Manager {
	return &Manager{db: db}
}

// Transaction types
const (
	TypeSignupBonus      = "signup_bonus"
	TypeDailyLogin       = "daily_login"
	TypeWebsiteGen       = "website_generation"
	TypeReferral         = "referral"
	TypePurchase         = "purchase"
	TypeAdminGrant       = "admin_grant"
)

// GetBalance returns the current token balance for a user
func (m *Manager) GetBalance(userID uuid.UUID) (int, error) {
	var user models.User
	if err := m.db.DB.Select("tokens_balance").First(&user, "id = ?", userID).Error; err != nil {
		return 0, fmt.Errorf("failed to get balance: %w", err)
	}
	return user.TokensBalance, nil
}

// HasEnoughTokens checks if user has enough tokens
func (m *Manager) HasEnoughTokens(userID uuid.UUID, amount int) (bool, error) {
	balance, err := m.GetBalance(userID)
	if err != nil {
		return false, err
	}
	return balance >= amount, nil
}

// AddTokens adds tokens to a user's balance (for credits)
func (m *Manager) AddTokens(userID uuid.UUID, amount int, txType, description string, relatedWebsiteID *uuid.UUID) (*models.TokenTransaction, error) {
	var transaction *models.TokenTransaction

	err := m.db.DB.Transaction(func(tx *gorm.DB) error {
		var err error
		transaction, err = m.AddTokensTx(tx, userID, amount, txType, description, relatedWebsiteID)
		return err
	})

	return transaction, err
}

// AddTokensTx adds tokens within a transaction
func (m *Manager) AddTokensTx(tx *gorm.DB, userID uuid.UUID, amount int, txType, description string, relatedWebsiteID *uuid.UUID) (*models.TokenTransaction, error) {
	// Lock user row for update
	var user models.User
	if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&user, "id = ?", userID).Error; err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	newBalance := user.TokensBalance + amount

	// Update user balance
	if err := tx.Model(&user).Update("tokens_balance", newBalance).Error; err != nil {
		return nil, fmt.Errorf("failed to update balance: %w", err)
	}

	// Create transaction record
	transaction := &models.TokenTransaction{
		UserID:           userID,
		Amount:           amount,
		BalanceAfter:     newBalance,
		Type:             txType,
		Description:      description,
		RelatedWebsiteID: relatedWebsiteID,
	}

	if err := tx.Create(transaction).Error; err != nil {
		return nil, fmt.Errorf("failed to create transaction: %w", err)
	}

	return transaction, nil
}

// DeductTokens deducts tokens from a user's balance (for debits)
func (m *Manager) DeductTokens(userID uuid.UUID, amount int, txType, description string, relatedWebsiteID *uuid.UUID) (*models.TokenTransaction, error) {
	var transaction *models.TokenTransaction

	err := m.db.DB.Transaction(func(tx *gorm.DB) error {
		var err error
		transaction, err = m.DeductTokensTx(tx, userID, amount, txType, description, relatedWebsiteID)
		return err
	})

	return transaction, err
}

// DeductTokensTx deducts tokens within a transaction
func (m *Manager) DeductTokensTx(tx *gorm.DB, userID uuid.UUID, amount int, txType, description string, relatedWebsiteID *uuid.UUID) (*models.TokenTransaction, error) {
	// Lock user row for update
	var user models.User
	if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&user, "id = ?", userID).Error; err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	if user.TokensBalance < amount {
		return nil, fmt.Errorf("insufficient tokens: have %d, need %d", user.TokensBalance, amount)
	}

	newBalance := user.TokensBalance - amount

	// Update user balance
	if err := tx.Model(&user).Update("tokens_balance", newBalance).Error; err != nil {
		return nil, fmt.Errorf("failed to update balance: %w", err)
	}

	// Create transaction record (amount is negative for deductions)
	transaction := &models.TokenTransaction{
		UserID:           userID,
		Amount:           -amount,
		BalanceAfter:     newBalance,
		Type:             txType,
		Description:      description,
		RelatedWebsiteID: relatedWebsiteID,
	}

	if err := tx.Create(transaction).Error; err != nil {
		return nil, fmt.Errorf("failed to create transaction: %w", err)
	}

	return transaction, nil
}

// GetTransactions returns transaction history for a user
func (m *Manager) GetTransactions(userID uuid.UUID, limit, offset int) ([]models.TokenTransaction, int64, error) {
	var transactions []models.TokenTransaction
	var total int64

	// Get total count
	if err := m.db.DB.Model(&models.TokenTransaction{}).Where("user_id = ?", userID).Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count transactions: %w", err)
	}

	// Get paginated results
	if err := m.db.DB.Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&transactions).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to get transactions: %w", err)
	}

	return transactions, total, nil
}

// AwardSignupBonus awards the initial signup bonus
func (m *Manager) AwardSignupBonus(userID uuid.UUID) (*models.TokenTransaction, error) {
	return m.AddTokens(userID, 100, TypeSignupBonus, "Welcome bonus for signing up", nil)
}

// AwardDailyLogin awards daily login bonus (only once per day)
func (m *Manager) AwardDailyLogin(userID uuid.UUID) (*models.TokenTransaction, error) {
	// Check if already awarded today
	var lastTransaction models.TokenTransaction
	if err := m.db.DB.Where("user_id = ? AND type = ?", userID, TypeDailyLogin).
		Order("created_at DESC").
		First(&lastTransaction).Error; err == nil {
		// Check if it's from today
		if lastTransaction.CreatedAt.Day() == time.Now().Day() &&
			lastTransaction.CreatedAt.Month() == time.Now().Month() &&
			lastTransaction.CreatedAt.Year() == time.Now().Year() {
			return nil, fmt.Errorf("daily bonus already claimed")
		}
	}

	return m.AddTokens(userID, 10, TypeDailyLogin, "Daily login bonus", nil)
}