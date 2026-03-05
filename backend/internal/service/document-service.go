package service

import (
	"DiplomEDM/backend/internal/models"
	"DiplomEDM/backend/internal/repository"
	"errors"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
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

// AllowedMimeTypes разрешённые типы файлов
var AllowedMimeTypes = map[string]bool{
	"application/pdf":                                     true,
	"application/msword":                                  true,
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
}

// UploadDocument обрабатывает загрузку файла
func (s *DocumentService) UploadDocument(file *multipart.FileHeader, title, description string, authorID uint, storagePath string) (*models.Document, error) {
	// Проверяем тип файла
	if !AllowedMimeTypes[file.Header.Get("Content-Type")] {
		return nil, errors.New("file type not allowed (only PDF, DOC, DOCX)")
	}

	// Проверяем расширение
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".pdf" && ext != ".doc" && ext != ".docx" {
		return nil, errors.New("file extension not allowed")
	}

	// Генерируем уникальное имя файла
	fileName := fmt.Sprintf("%d_%s", authorID, file.Filename)
	filePath := filepath.Join(storagePath, fileName)

	// Сохраняем файл на диск
	if err := saveFile(file, filePath); err != nil {
		return nil, err
	}

	// Создаём запись в БД
	doc := &models.Document{
		Title:         title,
		Description:   description,
		FilePath:      filePath,
		FileName:      file.Filename,
		FileSize:      file.Size,
		MimeType:      file.Header.Get("Content-Type"),
		AuthorID:      authorID,
		CurrentStatus: models.StatusDraft,
	}

	if err := s.repo.CreateDocument(doc); err != nil {
		return nil, err
	}

	// 📝 ЛОГИРУЕМ СОЗДАНИЕ В ИСТОРИЮ
	if err := s.historyService.LogDocumentCreation(doc.ID, authorID); err != nil {
		// Не прерываем операцию, если логирование не удалось
		log.Printf("Warning: failed to log history: %v", err)
	}

	return doc, nil
}

// saveFile сохраняет файл на диск
func saveFile(file *multipart.FileHeader, filePath string) error {
	// Создаём папку, если нет
	dir := filepath.Dir(filePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	// Открываем исходный файл
	src, err := file.Open()
	if err != nil {
		return err
	}
	defer src.Close()

	// Создаём файл назначения
	out, err := os.Create(filePath)
	if err != nil {
		return err
	}
	defer out.Close()

	// Копируем данные
	_, err = io.Copy(out, src)
	return err
}

// GetMyDocuments получает список документов текущего пользователя
func (s *DocumentService) GetMyDocuments(authorID uint) ([]models.Document, error) {
	return s.repo.GetDocumentsByAuthor(authorID)
}

// GetDocumentByID получает документ по ID с проверкой прав
func (s *DocumentService) GetDocumentByID(id, userID uint, userRole string) (*models.Document, error) {
	doc, err := s.repo.GetDocumentByID(id)
	if err != nil {
		return nil, err
	}

	// Проверка прав: админ видит всё, сотрудник — только своё
	if userRole != "admin" && doc.AuthorID != userID {
		return nil, errors.New("access denied")
	}

	return doc, nil
}