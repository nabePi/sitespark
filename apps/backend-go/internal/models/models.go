package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// User represents a user in the system
type User struct {
	ID               uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Email            string    `gorm:"uniqueIndex;not null" json:"email" validate:"required,email"`
	Password         string    `gorm:"not null" json:"-"`
	Name             string    `json:"name"`
	AvatarURL        string    `json:"avatarUrl"`
	SubscriptionTier string    `gorm:"default:'free'" json:"subscriptionTier"`
	TokensBalance    int       `gorm:"default:100" json:"tokensBalance"`
	CreatedAt        time.Time `json:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt"`
	Websites         []Website `json:"websites,omitempty"`
	Transactions     []TokenTransaction `json:"transactions,omitempty"`
}

// Website represents a generated website
type Website struct {
	ID               uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID           uuid.UUID      `gorm:"not null" json:"userId"`
	User             User           `json:"user,omitempty"`
	Subdomain        string         `gorm:"uniqueIndex;not null" json:"subdomain" validate:"required"`
	CustomDomain     string         `gorm:"uniqueIndex" json:"customDomain"`
	Title            string         `json:"title"`
	Description      string         `json:"description"`
	TemplateID       string         `json:"templateId"`
	Status           string         `gorm:"default:'draft'" json:"status"` // draft, published, archived
	Config           datatypes.JSON `json:"config"`
	DesignTokens     datatypes.JSON `json:"designTokens"`
	GeneratedContent datatypes.JSON `json:"generatedContent"`
	ViewCount        int            `gorm:"default:0" json:"viewCount"`
	CreatedAt        time.Time      `json:"createdAt"`
	UpdatedAt        time.Time      `json:"updatedAt"`
	PublishedAt      *time.Time     `json:"publishedAt"`
}

// TokenTransaction represents a token credit/debit transaction
type TokenTransaction struct {
	ID               uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID           uuid.UUID  `gorm:"not null" json:"userId"`
	User             User       `json:"user,omitempty"`
	Amount           int        `gorm:"not null" json:"amount"`           // positive = credit, negative = debit
	BalanceAfter     int        `gorm:"not null" json:"balanceAfter"`
	Type             string     `gorm:"not null" json:"type"`             // signup_bonus, daily_login, website_generation, etc.
	Description      string     `json:"description"`
	RelatedWebsiteID *uuid.UUID `json:"relatedWebsiteId"`
	CreatedAt        time.Time  `json:"createdAt"`
}

// BeforeCreate hook to generate UUID
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

func (w *Website) BeforeCreate(tx *gorm.DB) error {
	if w.ID == uuid.Nil {
		w.ID = uuid.New()
	}
	return nil
}

func (t *TokenTransaction) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}

// Response types for API

// UserResponse is the public user data
func (u *User) Response() map[string]interface{} {
	return map[string]interface{}{
		"id":               u.ID,
		"email":            u.Email,
		"name":             u.Name,
		"avatarUrl":        u.AvatarURL,
		"subscriptionTier": u.SubscriptionTier,
		"tokensBalance":    u.TokensBalance,
		"createdAt":        u.CreatedAt,
		"updatedAt":        u.UpdatedAt,
	}
}

// WebsiteResponse is the public website data
func (w *Website) Response() map[string]interface{} {
	return map[string]interface{}{
		"id":               w.ID,
		"userId":           w.UserID,
		"subdomain":        w.Subdomain,
		"customDomain":     w.CustomDomain,
		"title":            w.Title,
		"description":      w.Description,
		"templateId":       w.TemplateID,
		"status":           w.Status,
		"config":           w.Config,
		"designTokens":     w.DesignTokens,
		"generatedContent": w.GeneratedContent,
		"viewCount":        w.ViewCount,
		"createdAt":        w.CreatedAt,
		"updatedAt":        w.UpdatedAt,
		"publishedAt":      w.PublishedAt,
	}
}

// TransactionResponse is the public transaction data
func (t *TokenTransaction) Response() map[string]interface{} {
	return map[string]interface{}{
		"id":               t.ID,
		"userId":           t.UserID,
		"amount":           t.Amount,
		"balanceAfter":     t.BalanceAfter,
		"type":             t.Type,
		"description":      t.Description,
		"relatedWebsiteId": t.RelatedWebsiteID,
		"createdAt":        t.CreatedAt,
	}
}