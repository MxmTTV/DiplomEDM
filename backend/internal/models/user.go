package models

import (
	"golang.org/x/crypto/bcrypt"
	"time"
)

type UserRole string

const (
	RoleAdmin    UserRole = "admin"
	RoleEmployee UserRole = "employee"
)

type User struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	Email        string    `json:"email" gorm:"uniqueIndex:idx_users_email;not null"`
	PasswordHash string    `json:"-" gorm:"not null"` // Не выводим в JSON
	FullName     string    `json:"full_name" gorm:"not null"`
	Role         UserRole  `json:"role" gorm:"type:user_role;default:'employee'"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// HashPassword хэширует пароль перед сохранением
func (u *User) HashPassword(password string) error {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	if err != nil {
		return err
	}
	u.PasswordHash = string(bytes)
	return nil
}

// CheckPassword проверяет пароль при входе
func (u *User) CheckPassword(password string) error {
	return bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
}

func (User) TableName() string {
	return "users"
}