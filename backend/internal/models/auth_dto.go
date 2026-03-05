package models

import "github.com/golang-jwt/jwt/v5"

// RegisterRequest - запрос на регистрацию
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	FullName string `json:"full_name" binding:"required"`
}

// LoginRequest - запрос на вход
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// AuthResponse - ответ с токеном
type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

// JWTClaims - структура для claims в JWT
type JWTClaims struct {
	UserID uint   `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}