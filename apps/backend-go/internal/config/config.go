package config

import (
	"time"

	"github.com/spf13/viper"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Redis    RedisConfig
	JWT      JWTConfig
	Kimi     KimiConfig
}

type ServerConfig struct {
	Port         string
	Environment  string
	AllowOrigins []string
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
	SSLMode  string
}

type RedisConfig struct {
	Host     string
	Port     string
	Password string
	DB       int
}

type JWTConfig struct {
	Secret    string
	ExpiresIn time.Duration
}

type KimiConfig struct {
	APIKey string
	BaseURL string
}

func Load() (*Config, error) {
	viper.SetDefault("SERVER_PORT", "3001")
	viper.SetDefault("SERVER_ENV", "development")
	viper.SetDefault("SERVER_ALLOW_ORIGINS", "*")

	viper.SetDefault("DB_HOST", "localhost")
	viper.SetDefault("DB_PORT", "5432")
	viper.SetDefault("DB_USER", "postgres")
	viper.SetDefault("DB_PASSWORD", "postgres")
	viper.SetDefault("DB_NAME", "sitespark")
	viper.SetDefault("DB_SSLMODE", "disable")

	viper.SetDefault("REDIS_HOST", "localhost")
	viper.SetDefault("REDIS_PORT", "6379")
	viper.SetDefault("REDIS_PASSWORD", "")
	viper.SetDefault("REDIS_DB", 0)

	viper.SetDefault("JWT_SECRET", "your-secret-key-change-in-production")
	viper.SetDefault("JWT_EXPIRES_IN", "24h")

	viper.SetDefault("KIMI_API_KEY", "")
	viper.SetDefault("KIMI_BASE_URL", "https://api.kimi.com/coding")

	viper.AutomaticEnv()

	expiresIn, err := time.ParseDuration(viper.GetString("JWT_EXPIRES_IN"))
	if err != nil {
		expiresIn = 24 * time.Hour
	}

	return &Config{
		Server: ServerConfig{
			Port:         viper.GetString("SERVER_PORT"),
			Environment:  viper.GetString("SERVER_ENV"),
			AllowOrigins: viper.GetStringSlice("SERVER_ALLOW_ORIGINS"),
		},
		Database: DatabaseConfig{
			Host:     viper.GetString("DB_HOST"),
			Port:     viper.GetString("DB_PORT"),
			User:     viper.GetString("DB_USER"),
			Password: viper.GetString("DB_PASSWORD"),
			Name:     viper.GetString("DB_NAME"),
			SSLMode:  viper.GetString("DB_SSLMODE"),
		},
		Redis: RedisConfig{
			Host:     viper.GetString("REDIS_HOST"),
			Port:     viper.GetString("REDIS_PORT"),
			Password: viper.GetString("REDIS_PASSWORD"),
			DB:       viper.GetInt("REDIS_DB"),
		},
		JWT: JWTConfig{
			Secret:    viper.GetString("JWT_SECRET"),
			ExpiresIn: expiresIn,
		},
		Kimi: KimiConfig{
			APIKey:  viper.GetString("KIMI_API_KEY"),
			BaseURL: viper.GetString("KIMI_BASE_URL"),
		},
	}, nil
}

func (c *Config) GetDSN() string {
	return "host=" + c.Database.Host +
		" user=" + c.Database.User +
		" password=" + c.Database.Password +
		" dbname=" + c.Database.Name +
		" port=" + c.Database.Port +
		" sslmode=" + c.Database.SSLMode
}