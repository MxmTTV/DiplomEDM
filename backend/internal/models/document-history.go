package models

import "time"

type HistoryAction string

const (
	ActionCreated       HistoryAction = "created"
	ActionStatusChanged HistoryAction = "status_changed"
	ActionCommented     HistoryAction = "commented"
	ActionDownloaded    HistoryAction = "downloaded"
)

type DocumentHistory struct {
	ID          uint          `json:"id" gorm:"primaryKey"`
	DocumentID  uint          `json:"document_id" gorm:"not null;index"`
	UserID      uint          `json:"user_id" gorm:"not null;index"`
	User        User          `json:"user" gorm:"foreignKey:UserID"`
	Action      HistoryAction `json:"action" gorm:"type:varchar(50);not null"`
	Comment     string        `json:"comment,omitempty"`
	OldStatus   string        `json:"old_status,omitempty"`
	NewStatus   string        `json:"new_status,omitempty"`
	CreatedAt   time.Time     `json:"created_at"`
}

func (DocumentHistory) TableName() string {
	return "document_history"
}