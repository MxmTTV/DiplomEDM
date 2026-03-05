package models

import "time"

type DocumentStatus string

const (
	StatusDraft      DocumentStatus = "draft"        // Создан
	StatusPending    DocumentStatus = "pending"      // На согласовании
	StatusApproved   DocumentStatus = "approved"     // Утверждён
	StatusRejected   DocumentStatus = "rejected"     // Отклонён
	StatusArchived   DocumentStatus = "archived"     // Архивирован
)

type Document struct {
    ID               uint           `json:"id" gorm:"primaryKey"`
    Title            string         `json:"title" gorm:"not null"`
    Description      string         `json:"description"`
    FilePath         string         `json:"file_path" gorm:"not null"`
    FileName         string         `json:"file_name" gorm:"not null"`
    FileSize         int64          `json:"file_size" gorm:"not null"`
    MimeType         string         `json:"mime_type" gorm:"not null"`
    AuthorID         uint           `json:"author_id" gorm:"not null"`
    Author           User           `json:"author" gorm:"foreignKey:AuthorID"`
  
    CurrentStatus DocumentStatus `json:"current_status" gorm:"type:varchar(50);default:'draft'"`
    
    CreatedAt        time.Time      `json:"created_at"`
    UpdatedAt        time.Time      `json:"updated_at"`
}

func (Document) TableName() string {
	return "documents"
}