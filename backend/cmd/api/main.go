package main

import (
	"DiplomEDM/backend/internal/config"
	"DiplomEDM/backend/internal/handler"
	"DiplomEDM/backend/internal/middleware"
	"DiplomEDM/backend/internal/repository"
	"DiplomEDM/backend/internal/service"
	"DiplomEDM/backend/internal/utils"
	"fmt"
	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"log"
	"net/http"
	"time"
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
			docs.GET("", docHandler.GetMyDocuments)
			docs.GET("/:id", docHandler.GetDocumentByID)
			docs.GET("/:id/download", docHandler.DownloadDocument)
			
			// 📝 История документа
			docs.GET("/:id/history", historyHandler.GetDocumentHistory)
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