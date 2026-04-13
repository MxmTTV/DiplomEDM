package main

import (
	"DiplomEDM/backend/internal/config"
	"DiplomEDM/backend/internal/handler"
	"DiplomEDM/backend/internal/middleware"
	"DiplomEDM/backend/internal/repository"
	"DiplomEDM/backend/internal/service"
	"DiplomEDM/backend/internal/utils"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// 1. Загружаем конфигурацию
	cfg := config.Load()

	// 2. Подключение к БД
	db, err := gorm.Open(postgres.Open(cfg.DSN()), &gorm.Config{})
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}
	log.Println("✅ Database connected successfully")

	// 3. JWT Manager
	jwtMgr := utils.NewJWTManager(cfg.JWTSecret, time.Hour*24)

	// 4. Инициализация репозиториев
	userRepo := repository.NewUserRepository(db)
	docRepo := repository.NewDocumentRepository(db)
	historyRepo := repository.NewHistoryRepository(db)

	// 5. Инициализация сервисов
	userService := service.NewUserService(userRepo, jwtMgr)
	historyService := service.NewHistoryService(historyRepo)
	docService := service.NewDocumentService(docRepo, historyService)

	// 6. Инициализация хендлеров
	userHandler := handler.NewUserHandler(userService)
	docHandler := handler.NewDocumentHandler(docService)
	historyHandler := handler.NewHistoryHandler(historyService)

	// 7. Gin
	r := gin.Default()

	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "http://localhost:5173")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Header("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// 8. Health-check (публичный)
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "db": "connected"})
	})

	// 9. Публичные роуты авторизации
	auth := r.Group("/api/auth")
	{
		auth.POST("/register", userHandler.Register)
		auth.POST("/login", userHandler.Login)
	}

	// 10. Защищённые роуты (требуют токен)
	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware(jwtMgr))
	{
		// Документы
		docs := api.Group("/documents")
		{
			docs.POST("", docHandler.UploadDocument)
			docs.GET("", docHandler.GetDocumentsWithFilters)
			docs.GET("/:id", docHandler.GetDocumentByID)
			docs.GET("/:id/download", docHandler.DownloadDocument)
			docs.GET("/:id/history", historyHandler.GetDocumentHistory)
			docs.PATCH("/:id/status", docHandler.ChangeStatus)
		}

		// Админские роуты (только admin)
		admin := api.Group("/admin")
		admin.Use(middleware.RequireRole("admin"))
		{
			admin.GET("/all-documents", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"message": "admin only"})
			})
		}
	} // ← Здесь ЗАКРЫВАЕМ группу api

	// 11. Запуск сервера (ВНЕ всех групп!)
	addr := fmt.Sprintf(":%s", cfg.ServerPort)
	log.Printf("🚀 Server starting on http://localhost%s", addr)

	if err := r.Run(addr); err != nil {
		log.Fatalf("❌ Failed to start server: %v", err)
	}
}
