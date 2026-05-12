package repository

import (
	"DiplomEDM/backend/internal/models"

	"gorm.io/gorm"
)

type DocumentRepository struct {
	db *gorm.DB
}

func NewDocumentRepository(db *gorm.DB) *DocumentRepository {
	return &DocumentRepository{db: db}
}

// CreateDocument создаёт новый документ
func (r *DocumentRepository) CreateDocument(doc *models.Document) error {
	return r.db.Create(doc).Error
}

// GetDocumentsByAuthor получает документы автора
func (r *DocumentRepository) GetDocumentsByAuthor(authorID uint) ([]models.Document, error) {
	var docs []models.Document
	err := r.db.Where("author_id = ?", authorID).
		Preload("Author").
		Order("created_at DESC").
		Find(&docs).Error
	return docs, err
}

// GetDocumentByID получает документ по ID
func (r *DocumentRepository) GetDocumentByID(id uint) (*models.Document, error) {
	var doc models.Document
	err := r.db.Preload("Author").First(&doc, id).Error
	if err != nil {
		return nil, err
	}
	return &doc, nil
}

// UpdateDocumentStatus обновляет статус
func (r *DocumentRepository) UpdateDocumentStatus(id uint, status string) error {
	return r.db.Model(&models.Document{}).
		Where("id = ?", id).
		Update("current_status_code", status).Error
}

// GetDocumentsWithFilters — основной метод с фильтрами
func (r *DocumentRepository) GetDocumentsWithFilters(authorID uint, userRole string, status, title, dateFrom, dateTo string) ([]models.Document, error) {
	var docs []models.Document
	query := r.db.Model(&models.Document{}).Preload("Author")

	// Ограничение по автору для обычных пользователей
	if userRole != models.RoleDirector && userRole != "admin" && userRole != models.RoleSecretary {
		query = query.Where("author_id = ?", authorID)
	}

	// Фильтр по статусу
	if status != "" {
		query = query.Where("current_status_code = ?", status)
	}

	// Поиск по названию
	if title != "" {
		query = query.Where("title ILIKE ?", "%"+title+"%")
	}

	// Фильтр по дате
	if dateFrom != "" {
		query = query.Where("created_at >= ?", dateFrom)
	}
	if dateTo != "" {
		query = query.Where("created_at <= ?", dateTo)
	}

	err := query.Order("created_at DESC").Find(&docs).Error
	return docs, err
}

// GetAllDocuments — возвращает все документы без фильтрации
func (r *DocumentRepository) GetAllDocuments() ([]models.Document, error) {
	var docs []models.Document
	// ✅ БЕЗ WHERE ПО AUTHOR_ID — возвращаем всё!
	err := r.db.Preload("Author").Order("created_at DESC").Find(&docs).Error
	return docs, err
}
