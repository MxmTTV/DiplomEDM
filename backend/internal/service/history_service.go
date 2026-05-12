package service

import (
	"DiplomEDM/backend/internal/models"
	"DiplomEDM/backend/internal/repository"
	"time"
)

type HistoryService struct {
	repo *repository.HistoryRepository
}

func NewHistoryService(repo *repository.HistoryRepository) *HistoryService {
	return &HistoryService{repo: repo}
}

// GetDocumentHistory получает историю документа
func (s *HistoryService) GetDocumentHistory(documentID uint) ([]models.DocumentHistory, error) {
	return s.repo.GetHistoryByDocumentID(documentID)
}

// LogDocumentCreation логирует создание документа
func (s *HistoryService) LogDocumentCreation(documentID, userID uint) error {
	history := &models.DocumentHistory{
		DocumentID: documentID,
		UserID:     userID,
		Action:     "created",
		CreatedAt:  time.Now(),
	}
	return s.repo.CreateHistory(history)
}

// LogStatusChange логирует смену статуса
func (s *HistoryService) LogStatusChange(documentID, userID uint, oldStatus, newStatus, comment string) error {
	history := &models.DocumentHistory{
		DocumentID: documentID,
		UserID:     userID,
		Action:     "status_change",
		OldStatus:  oldStatus,
		NewStatus:  newStatus,
		Comment:    comment,
		CreatedAt:  time.Now(),
	}
	return s.repo.CreateHistory(history)
}
