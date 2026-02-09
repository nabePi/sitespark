package middleware

import (
	"backend-go/internal/config"

	"github.com/gin-gonic/gin"
)

// CORSMiddleware creates a middleware for handling CORS
func CORSMiddleware(cfg *config.ServerConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		
		allowedOrigin := "*"
		if len(cfg.AllowOrigins) > 0 && cfg.AllowOrigins[0] != "*" {
			for _, o := range cfg.AllowOrigins {
				if o == origin {
					allowedOrigin = origin
					break
				}
			}
		}

		c.Writer.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, PATCH, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}