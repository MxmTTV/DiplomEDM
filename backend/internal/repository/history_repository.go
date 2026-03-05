package repository

import (
	"DiplomEDM/backend/internal/models"
	"gorm.io/gorm"
)

type HistoryRepository struct {
	db *gorm.DB
}

func NewHistoryRepository(db *gorm.DB) *HistoryRepository {
	return &HistoryRepository{db: db}
}

// CreateHistory записывает событие в историю
func (r *HistoryRepository) CreateHistory(history *models.DocumentHistory) error {
	return r.db.Create(history).Error
}

// GetHistoryByDocumentID получает историю документа
func (r *HistoryRepository) GetHistoryByDocumentID(documentID uint) ([]models.DocumentHistory, error) {
	var history []models.DocumentHistory
	err := r.db.Where("document_id = ?", documentID).
		Preload("User").
		Order("created_at DESC").
		Find(&history).Error
	return history, err
}