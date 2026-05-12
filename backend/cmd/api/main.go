package main

import (
	"DiplomEDM/backend/internal/config"
	"DiplomEDM/backend/internal/handler"
	"DiplomEDM/backend/internal/middleware"
	"DiplomEDM/backend/internal/repository"
	"DiplomEDM/backend/internal/service"
	"DiplomEDM/backend/internal/utils"
	"DiplomEDM/backend/internal/models"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// 1. Конфигурация
	cfg := config.Load()

	// 2. Подключение к БД
	db, err := gorm.Open(postgres.Open(cfg.DSN()), &gorm.Config{})
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}
	log.Println("✅ Database connected successfully")

	// 3. JWT
	jwtMgr := utils.NewJWTManager(cfg.JWTSecret, time.Hour*24)

	// 4. Репозитории
	userRepo := repository.NewUserRepository(db)
	docRepo := repository.NewDocumentRepository(db)
	historyRepo := repository.NewHistoryRepository(db)

	// 5. Сервисы
	userService := service.NewUserService(userRepo, jwtMgr)
	historyService := service.NewHistoryService(historyRepo)
	docService := service.NewDocumentService(docRepo, historyService)

	// 6. Хендлеры
	userHandler := handler.NewUserHandler(userService)
	docHandler := handler.NewDocumentHandler(docService)
	historyHandler := handler.NewHistoryHandler(historyService)

	// 7. Gin + CORS
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

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Публичные роуты
	auth := r.Group("/api/auth")
	{
		auth.POST("/register", userHandler.Register)
		auth.POST("/login", userHandler.Login)
	}

	// Защищённые роуты
	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware(jwtMgr))
	{
		docs := api.Group("/documents")
		{
			docs.POST("", docHandler.UploadDocument)
			docs.GET("", docHandler.GetDocumentsWithFilters)
			docs.GET("/:id", docHandler.GetDocumentByID)
			docs.GET("/:id/download", docHandler.DownloadDocument)
			docs.PATCH("/:id/status", docHandler.ChangeStatus)
			docs.GET("/:id/history", historyHandler.GetDocumentHistory) // пока закомментировано
		}

		// Админ панель
		admin := api.Group("/admin")
		admin.Use(middleware.RequireRole(models.RoleDirector, "admin"))
		{
			admin.GET("/all-documents", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"message": "admin only route"})
			})
		}
	}

	// Запуск сервера
	addr := fmt.Sprintf(":%s", cfg.ServerPort)
	log.Printf("🚀 Server starting on http://localhost%s", addr)

	if err := r.Run(addr); err != nil {
		log.Fatalf("❌ Failed to start server: %v", err)
	}
}