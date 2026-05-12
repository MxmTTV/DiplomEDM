package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
)

// === Роли пользователей ===
const (
	RoleDirector  = "director"
	RoleSecretary = "secretary"
	RoleZavuch    = "zavuch"
	RoleTeacher   = "teacher"
)

// === Статусы документов ===
const (
	StatusDraft     = "draft"
	StatusReview    = "review"
	StatusApproved  = "approved"
	StatusRejected  = "rejected"
	StatusCompleted = "completed"
)

// User представляет пользователя системы
type User struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	Email        string    `json:"email" gorm:"uniqueIndex:idx_users_email;not null"`
	PasswordHash string    `json:"-" gorm:"column:password_hash;not null"`
	FullName     string    `json:"full_name" gorm:"not null"`
	Role         string    `json:"role" gorm:"type:varchar(50);not null;default:'teacher'"`
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