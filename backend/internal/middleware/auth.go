package middleware

import (
	"log"
	"net/http"
	"strings"

	"DiplomEDM/backend/internal/utils"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware(jwtMgr *utils.JWTManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := c.GetHeader("Authorization")
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Требуется авторизация"})
			c.Abort()
			return
		}

		tokenString = strings.TrimPrefix(tokenString, "Bearer ")

		claims, err := jwtMgr.VerifyToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверный токен"})
			c.Abort()
			return
		}

		// Сохраняем данные пользователя в контекст
		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Set("user_role", strings.TrimSpace(claims.Role)) // ❗ TrimSpace на всякий случай

		log.Printf("🔐 AuthMiddleware: set user_role='%s'", claims.Role) // 🐛 ЛОГ

		c.Next()
	}
}
