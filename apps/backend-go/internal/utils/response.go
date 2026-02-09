package utils

import (
	"github.com/gin-gonic/gin"
)

// Response is the standard API response format
type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   *ErrorInfo  `json:"error,omitempty"`
}

// ErrorInfo contains error details
type ErrorInfo struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// JSONSuccess sends a successful response
func JSONSuccess(c *gin.Context, code int, data interface{}) {
	c.JSON(code, Response{
		Success: true,
		Data:    data,
	})
}

// JSONError sends an error response
func JSONError(c *gin.Context, code int, errCode, message string) {
	c.JSON(code, Response{
		Success: false,
		Error: &ErrorInfo{
			Code:    errCode,
			Message: message,
		},
	})
}

// Common error codes
const (
	ErrCodeBadRequest       = "BAD_REQUEST"
	ErrCodeUnauthorized     = "UNAUTHORIZED"
	ErrCodeForbidden        = "FORBIDDEN"
	ErrCodeNotFound         = "NOT_FOUND"
	ErrCodeConflict         = "CONFLICT"
	ErrCodeValidation       = "VALIDATION_ERROR"
	ErrCodeInternal         = "INTERNAL_ERROR"
	ErrCodeTooManyRequests  = "TOO_MANY_REQUESTS"
	ErrCodeInsufficientTokens = "INSUFFICIENT_TOKENS"
)

// Error shortcuts
func BadRequest(c *gin.Context, message string) {
	JSONError(c, 400, ErrCodeBadRequest, message)
}

func Unauthorized(c *gin.Context, message string) {
	JSONError(c, 401, ErrCodeUnauthorized, message)
}

func Forbidden(c *gin.Context, message string) {
	JSONError(c, 403, ErrCodeForbidden, message)
}

func NotFound(c *gin.Context, message string) {
	JSONError(c, 404, ErrCodeNotFound, message)
}

func Conflict(c *gin.Context, message string) {
	JSONError(c, 409, ErrCodeConflict, message)
}

func ValidationError(c *gin.Context, message string) {
	JSONError(c, 422, ErrCodeValidation, message)
}

func InternalError(c *gin.Context) {
	JSONError(c, 500, ErrCodeInternal, "Internal server error")
}

func InsufficientTokens(c *gin.Context) {
	JSONError(c, 402, ErrCodeInsufficientTokens, "Insufficient tokens")
}