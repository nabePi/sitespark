package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"backend-go/internal/config"
	"backend-go/internal/database"
	"backend-go/internal/handlers"
	"backend-go/internal/middleware"
	"backend-go/internal/services/ai"
	"backend-go/internal/services/token"
	"backend-go/internal/services/website"
	"backend-go/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

func main() {
	// Initialize logger
	logrus.SetFormatter(&logrus.JSONFormatter{})
	logrus.SetOutput(os.Stdout)
	logrus.SetLevel(logrus.InfoLevel)

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		logrus.WithError(err).Fatal("Failed to load configuration")
	}

	// Set log level based on environment
	if cfg.Server.Environment == "development" {
		logrus.SetLevel(logrus.DebugLevel)
		logrus.SetFormatter(&logrus.TextFormatter{
			FullTimestamp: true,
		})
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	// Initialize database
	db, err := database.New(cfg)
	if err != nil {
		logrus.WithError(err).Fatal("Failed to connect to database")
	}

	// Run migrations
	if err := db.Migrate(); err != nil {
		logrus.WithError(err).Fatal("Failed to run migrations")
	}

	// Initialize utilities
	jwtUtil := utils.NewJWTUtil(&cfg.JWT)

	// Initialize services
	tokenMgr := token.NewManager(db)
	kimiClient := ai.NewKimiClient(&cfg.Kimi)
	websiteGen := website.NewGenerator(db, kimiClient, tokenMgr)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(db, jwtUtil, tokenMgr)
	userHandler := handlers.NewUserHandler(db)
	websiteHandler := handlers.NewWebsiteHandler(db, websiteGen)
	aiHandler := handlers.NewAIHandler(db, kimiClient, websiteGen)
	tokenHandler := handlers.NewTokenHandler(db, tokenMgr)

	// Setup router
	r := gin.New()
	r.Use(middleware.ErrorMiddleware())
	r.Use(middleware.LoggerMiddleware())
	r.Use(middleware.CORSMiddleware(&cfg.Server))

	// Health check
	r.GET("/health", func(c *gin.Context) {
		if err := db.Health(); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"status": "unhealthy",
				"error":  err.Error(),
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"timestamp": time.Now().Unix(),
		})
	})

	// API routes
	api := r.Group("/api")
	{
		// Auth routes (public)
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.Refresh)
			auth.GET("/me", middleware.AuthMiddleware(jwtUtil), authHandler.Me)
		}

		// User routes (protected)
		user := api.Group("/user")
		user.Use(middleware.AuthMiddleware(jwtUtil))
		{
			user.GET("/profile", userHandler.GetProfile)
			user.PUT("/profile", userHandler.UpdateProfile)
		}

		// Website routes (protected)
		websites := api.Group("/websites")
		websites.Use(middleware.AuthMiddleware(jwtUtil))
		{
			websites.GET("", websiteHandler.List)
			websites.GET("/:id", websiteHandler.Get)
			websites.POST("", websiteHandler.Create)
			websites.PUT("/:id", websiteHandler.Update)
			websites.DELETE("/:id", websiteHandler.Delete)
		}

		// AI routes (protected)
		ai := api.Group("/ai")
		ai.Use(middleware.AuthMiddleware(jwtUtil))
		{
			ai.POST("/generate", aiHandler.Generate)
		}
		// Chat can be optionally authenticated
		api.POST("/ai/chat", middleware.OptionalAuthMiddleware(jwtUtil), aiHandler.Chat)

		// Token routes (protected)
		tokens := api.Group("/tokens")
		tokens.Use(middleware.AuthMiddleware(jwtUtil))
		{
			tokens.GET("/balance", tokenHandler.GetBalance)
			tokens.GET("/transactions", tokenHandler.GetTransactions)
			tokens.POST("/daily", tokenHandler.ClaimDailyBonus)
		}
	}

	// Start server with graceful shutdown
	srv := &http.Server{
		Addr:    ":" + cfg.Server.Port,
		Handler: r,
	}

	// Graceful shutdown
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logrus.WithError(err).Fatal("Failed to start server")
		}
	}()

	logrus.WithField("port", cfg.Server.Port).Info("Server started")

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logrus.Info("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logrus.WithError(err).Fatal("Server forced to shutdown")
	}

	if err := db.Close(); err != nil {
		logrus.WithError(err).Error("Failed to close database connection")
	}

	logrus.Info("Server exited")
}