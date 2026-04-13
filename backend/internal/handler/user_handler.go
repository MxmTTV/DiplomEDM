package handler

import (
	"DiplomEDM/backend/internal/models"
	"DiplomEDM/backend/internal/service"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	service *service.UserService
}

func NewUserHandler(service *service.UserService) *UserHandler {
	return &UserHandler{service: service}
}

// Register обрабатывает регистрацию
func (h *UserHandler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.service.Register(&req)
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, resp)
}

// Login обрабатывает вход
// Login авторизует пользователя
func (h *UserHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 🐛 ЛОГ: что пришло
	log.Printf("🔍 Login attempt: email=%s, password_len=%d", req.Email, len(req.Password))

	// Вызываем сервис
	resp, err := h.service.Login(&req)
	if err != nil {
		// 🐛 ЛОГ: ошибка от сервиса
		log.Printf("❌ Login failed: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// 🐛 ЛОГ: успех
	log.Printf("✅ Login success: user_id=%d, role=%s", resp.User.ID, resp.User.Role)

	c.JSON(http.StatusOK, resp)
}
