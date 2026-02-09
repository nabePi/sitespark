package middleware

import (
	"strings"

	"backend-go/internal/utils"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware creates a middleware for JWT authentication
func AuthMiddleware(jwtUtil *utils.JWTUtil) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			utils.Unauthorized(c, "Authorization header required")
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			utils.Unauthorized(c, "Invalid authorization header format")
			c.Abort()
			return
		}

		claims, err := jwtUtil.ValidateToken(parts[1])
		if err != nil {
			utils.Unauthorized(c, "Invalid or expired token")
			c.Abort()
			return
		}

		c.Set("userId", claims.UserID)
		c.Set("email", claims.Email)
		c.Next()
	}
}

// OptionalAuthMiddleware creates a middleware for optional authentication
func OptionalAuthMiddleware(jwtUtil *utils.JWTUtil) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.Next()
			return
		}

		claims, err := jwtUtil.ValidateToken(parts[1])
		if err != nil {
			c.Next()
			return
		}

		c.Set("userId", claims.UserID)
		c.Set("email", claims.Email)
		c.Next()
	}
}