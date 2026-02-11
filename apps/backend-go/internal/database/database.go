package database

import (
	"fmt"
	"time"

	"backend-go/internal/config"
	"backend-go/internal/models"

	"github.com/sirupsen/logrus"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type Database struct {
	DB     *gorm.DB
	config *config.DatabaseConfig
}

func New(cfg *config.Config) (*Database, error) {
	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	}

	if cfg.Server.Environment == "development" {
		gormConfig.Logger = logger.Default.LogMode(logger.Info)
	}

	db, err := gorm.Open(postgres.Open(cfg.GetDSN()), gormConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get sql.DB: %w", err)
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	return &Database{
		DB:     db,
		config: &cfg.Database,
	}, nil
}

func (d *Database) Migrate() error {
	logrus.Info("Running database migrations...")
	
	err := d.DB.AutoMigrate(
		&models.User{},
		&models.Website{},
		&models.TokenTransaction{},
	)
	if err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	logrus.Info("Database migrations completed successfully")
	return nil
}

func (d *Database) Health() error {
	sqlDB, err := d.DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Ping()
}

func (d *Database) Close() error {
	sqlDB, err := d.DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

// GetDB returns the underlying gorm.DB instance
func (d *Database) GetDB() *gorm.DB {
	return d.DB
}