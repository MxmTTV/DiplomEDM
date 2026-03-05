package config

import (
	"github.com/joho/godotenv"
	"log"
	"os"
)

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	ServerPort string
	JWTSecret  string
}

func Load() *Config {
	// Загружаем .env файл
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found, using system env vars")
	}

	return &Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5433"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", "secret_password"),
		DBName:     getEnv("DB_NAME", "edm_db"),
		ServerPort: getEnv("APP_PORT", "8080"),
		JWTSecret:  getEnv("JWT_SECRET", "change_me_in_production"),
	}
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

// DSN возвращает строку подключения для GORM
func (c *Config) DSN() string {
	return "host=" + c.DBHost + 
		" port=" + c.DBPort + 
		" user=" + c.DBUser + 
		" password=" + c.DBPassword + 
		" dbname=" + c.DBName + 
		" sslmode=disable"
}