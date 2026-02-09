package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

// ErrorMiddleware handles panics and errors
func ErrorMiddleware() gin.HandlerFunc {
	return gin.RecoveryWithWriter(
		gin.DefaultWriter,
		func(c *gin.Context, err interface{}) {
			logrus.WithField("error", err).Error("Panic recovered")
			c.JSON(500, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "INTERNAL_ERROR",
					"message": "Internal server error",
				},
			})
		},
	)
}

// LoggerMiddleware logs requests
func LoggerMiddleware() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		logrus.WithFields(logrus.Fields{
			"status":     param.StatusCode,
			"latency":    param.Latency,
			"client_ip":  param.ClientIP,
			"method":     param.Method,
			"path":       param.Path,
			"error":      param.ErrorMessage,
		}).Info("Request")
		return ""
	})
}