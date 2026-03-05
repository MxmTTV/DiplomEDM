package service

import (
	"DiplomEDM/backend/internal/models"
	"DiplomEDM/backend/internal/repository"
)

type HistoryService struct {
	repo *repository.HistoryRepository
}

func NewHistoryService(repo *repository.HistoryRepository) *HistoryService {
	return &HistoryService{repo: repo}
}

// LogDocumentCreation логирует создание документа
func (s *HistoryService) LogDocumentCreation(documentID, userID uint) error {
	history := &models.DocumentHistory{
		DocumentID: documentID,
		UserID:     userID,
		Action:     models.ActionCreated,
		NewStatus:  string(models.StatusDraft),
	}
	return s.repo.CreateHistory(history)
}

// LogStatusChange логирует смену статуса
func (s *HistoryService) LogStatusChange(documentID, userID uint, oldStatus, newStatus, comment string) error {
	history := &models.DocumentHistory{
		DocumentID: documentID,
		UserID:     userID,
		Action:     models.ActionStatusChanged,
		Comment:    comment,
		OldStatus:  oldStatus,
		NewStatus:  newStatus,
	}
	return s.repo.CreateHistory(history)
}

// LogDownload логирует скачивание документа
func (s *HistoryService) LogDownload(documentID, userID uint) error {
	history := &models.DocumentHistory{
		DocumentID: documentID,
		UserID:     userID,
		Action:     models.ActionDownloaded,
	}
	return s.repo.CreateHistory(history)
}

// GetDocumentHistory получает историю документа
func (s *HistoryService) GetDocumentHistory(documentID uint) ([]models.DocumentHistory, error) {
	return s.repo.GetHistoryByDocumentID(documentID)
}