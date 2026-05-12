package service

import (
	"DiplomEDM/backend/internal/models"
	"DiplomEDM/backend/internal/repository"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time" // ← добавь, если используешь time.Now()
)

type DocumentService struct {
	repo           *repository.DocumentRepository
	historyService *HistoryService
}

func NewDocumentService(repo *repository.DocumentRepository, historyService *HistoryService) *DocumentService {
	return &DocumentService{
		repo:           repo,
		historyService: historyService,
	}
}

var AllowedMimeTypes = map[string]bool{
	"application/pdf":    true,
	"application/msword": true,
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
}

// UploadDocument — загрузка файла
func (s *DocumentService) UploadDocument(file *multipart.FileHeader, title, description string, authorID uint, storagePath string) (*models.Document, error) {
	if !AllowedMimeTypes[file.Header.Get("Content-Type")] {
		return nil, errors.New("недопустимый тип файла (только PDF, DOC, DOCX)")
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".pdf" && ext != ".doc" && ext != ".docx" {
		return nil, errors.New("недопустимое расширение файла")
	}

	// Уникальное имя файла
	fileName := fmt.Sprintf("%d_%d_%s", authorID, time.Now().Unix(), file.Filename)
	filePath := filepath.Join(storagePath, fileName)

	if err := s.saveFile(file, filePath); err != nil {
		return nil, err
	}

	doc := &models.Document{
		Title:             title,
		Description:       description,
		FilePath:          filePath,
		FileName:          file.Filename,
		FileSize:          file.Size,
		MimeType:          file.Header.Get("Content-Type"),
		AuthorID:          authorID,
		CurrentStatusCode: models.StatusDraft,
	}

	if err := s.repo.CreateDocument(doc); err != nil {
		return nil, err
	}

	// Логируем создание
	s.historyService.LogDocumentCreation(doc.ID, authorID)

	return doc, nil
}

func (s *DocumentService) saveFile(file *multipart.FileHeader, filePath string) error {
	dir := filepath.Dir(filePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	src, err := file.Open()
	if err != nil {
		return err
	}
	defer src.Close()

	out, err := os.Create(filePath)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, src)
	return err
}

// ChangeStatus — смена статуса (исправленная версия)
// ChangeStatus — смена статуса
func (s *DocumentService) ChangeStatus(id, userID uint, req *models.ChangeStatusRequest, userRole string) (*models.Document, error) {
	doc, err := s.repo.GetDocumentByID(id)
	if err != nil {
		return nil, errors.New("документ не найден")
	}

	oldStatus := doc.CurrentStatusCode
	newStatus := req.Status

	// ✅ ПРОВЕРКА ПРАВ
	// Директор может менять на ЛЮБОЙ статус без ограничений
	if userRole == models.RoleDirector || userRole == "admin" {
		// Директор может всё!
	} else {
		// Для остальных — проверка переходов
		if !s.canTransitionToStatus(userRole, oldStatus, newStatus) {
			return nil, fmt.Errorf("недостаточно прав для смены статуса на %s", newStatus)
		}
	}

	if err := s.repo.UpdateDocumentStatus(id, newStatus); err != nil {
		return nil, err
	}

	doc.CurrentStatusCode = newStatus

	// Логируем изменение
	s.historyService.LogStatusChange(id, userID, oldStatus, newStatus, req.Comment)

	return doc, nil
}

// Проверка прав на смену статуса
func (s *DocumentService) canChangeStatus(userRole string, authorID, userID uint) bool {
	switch userRole {
	case models.RoleDirector, "admin", models.RoleSecretary:
		// Директор и секретарь могут всё
		return true
	case models.RoleZavuch:
		// Завуч может только отправить на согласование (review)
		return false // Проверка будет в isValidStatusTransition
	case models.RoleTeacher:
		// Преподаватель не может менять статусы (только загружать)
		return false
	default:
		return false
	}
}

// Проверка допустимости перехода статусов с учётом роли
func (s *DocumentService) canTransitionToStatus(userRole string, from, to string) bool {
	// Сначала проверяем базовые переходы
	if !s.isValidStatusTransition(from, to) {
		return false
	}

	// ✅ ДИРЕКТОР МОЖЕТ ВСЁ!
	if userRole == models.RoleDirector || userRole == "admin" {
		return true
	}

	// Теперь проверяем права по ролям для остальных
	switch to {
	case models.StatusReview:
		// Отправить на согласование могут: директор, секретарь, завуч
		return userRole == models.RoleSecretary || userRole == models.RoleZavuch
	case models.StatusApproved, models.StatusRejected, models.StatusCompleted:
		// Утвердить/отклонить/архивировать могут: директор, секретарь
		return userRole == models.RoleSecretary
	default:
		return false
	}
}

// Проверка перехода статусов
func (s *DocumentService) isValidStatusTransition(from, to string) bool {
	transitions := map[string][]string{
		models.StatusDraft:     {models.StatusReview, models.StatusDraft},
		models.StatusReview:    {models.StatusApproved, models.StatusRejected, models.StatusDraft},
		models.StatusApproved:  {models.StatusCompleted, models.StatusReview},
		models.StatusRejected:  {models.StatusDraft, models.StatusReview},
		models.StatusCompleted: {models.StatusDraft},
	}

	allowed, exists := transitions[from]
	if !exists {
		return false
	}

	for _, status := range allowed {
		if status == to {
			return true
		}
	}
	return false
}

// Остальные методы (получение документов)
func (s *DocumentService) GetMyDocuments(authorID uint) ([]models.Document, error) {
	return s.repo.GetDocumentsByAuthor(authorID)
}

func (s *DocumentService) GetDocumentByID(id, userID uint, userRole string) (*models.Document, error) {
	doc, err := s.repo.GetDocumentByID(id)
	if err != nil {
		return nil, err
	}

	if !s.canChangeStatus(userRole, doc.AuthorID, userID) && userRole != models.RoleDirector && userRole != "admin" {
		if doc.AuthorID != userID {
			return nil, errors.New("access denied")
		}
	}

	return doc, nil
}

func (s *DocumentService) GetDocumentsWithFilters(authorID uint, userRole string, status, title, dateFrom, dateTo string) ([]models.Document, error) {
	return s.repo.GetDocumentsWithFilters(authorID, userRole, status, title, dateFrom, dateTo)
}

// GetAllDocuments — возвращает ВСЕ документы (для админов и общего просмотра)
func (s *DocumentService) GetAllDocuments() ([]models.Document, error) {
	return s.repo.GetAllDocuments()
}
