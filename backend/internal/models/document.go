package models

import "time"

type Document struct {
	ID                uint      `json:"id" gorm:"primaryKey"`
	Title             string    `json:"title" gorm:"not null"`
	Description       string    `json:"description" gorm:"type:text"`
	FilePath          string    `json:"file_path" gorm:"not null"`
	FileName          string    `json:"file_name" gorm:"not null"`
	FileSize          int64     `json:"file_size" gorm:"not null"`
	MimeType          string    `json:"mime_type" gorm:"not null"`
	AuthorID          uint      `json:"author_id" gorm:"not null"`
	Author            User      `json:"author,omitempty" gorm:"foreignKey:AuthorID"`
	CurrentStatusCode string    `json:"current_status_code" gorm:"column:current_status_code;type:varchar(50);not null;default:'draft'"`

	RegNumber  *string    `json:"reg_number,omitempty"`
	DueDate    *time.Time `json:"due_date,omitempty"`
	ExecutorID *uint      `json:"executor_id,omitempty"`
	Executor   User       `json:"executor,omitempty" gorm:"foreignKey:ExecutorID"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (Document) TableName() string {
	return "documents"
}