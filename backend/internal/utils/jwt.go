package utils

import (
	"DiplomEDM/backend/internal/models"
	"github.com/golang-jwt/jwt/v5"
	"time"
)

type JWTManager struct {
	secretKey string
	duration  time.Duration
}

func NewJWTManager(secretKey string, duration time.Duration) *JWTManager {
	return &JWTManager{secretKey: secretKey, duration: duration}
}

// GenerateToken создаёт JWT токен для пользователя
func (m *JWTManager) GenerateToken(user *models.User) (string, error) {
	claims := models.JWTClaims{
		UserID: user.ID,
		Email:  user.Email,
		Role:   string(user.Role),
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(m.duration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   string(user.Role),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(m.secretKey))
}

// VerifyToken проверяет и парсит JWT токен
func (m *JWTManager) VerifyToken(tokenString string) (*models.JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &models.JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(m.secretKey), nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*models.JWTClaims)
	if !ok || !token.Valid {
		return nil, jwt.ErrSignatureInvalid
	}

	return claims, nil
}