package handler

import (
	"DiplomEDM/backend/internal/models"
	"DiplomEDM/backend/internal/service"
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

// Login обрабатывает вход пользователя
func (h *UserHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ✅ ВЫЗЫВАЕМ СЕРВИС — ОН ВОЗВРАЩАЕТ AuthResponse
	resp, err := h.service.Login(&req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// ✅ ВОЗВРАЩАЕМ ОТВЕТ (уже с токеном!)
	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"id":        resp.ID,
			"email":     resp.Email,
			"full_name": resp.FullName,
			"role":      resp.Role,
		},
		"token": resp.Token,
	})
}
