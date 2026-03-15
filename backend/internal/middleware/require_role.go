package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// RequireRole проверяет, есть ли у пользователя нужная роль
func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Получаем роль из контекста (установленную в AuthMiddleware)
		userRole, exists := c.Get("user_role")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Требуется авторизация"})
			c.Abort()
			return
		}

		roleStr, ok := userRole.(string)
		if !ok {
			c.JSON(http.StatusForbidden, gin.H{"error": "Неверный формат роли"})
			c.Abort()
			return
		}

		// Проверяем, есть ли роль в списке разрешённых
		for _, allowedRole := range roles {
			if strings.EqualFold(roleStr, allowedRole) {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{"error": "Недостаточно прав"})
		c.Abort()
	}
}
