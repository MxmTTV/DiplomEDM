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

// GetDocumentsByAuthor получает документы конкретного автора
func (r *DocumentRepository) GetDocumentsByAuthor(authorID uint) ([]models.Document, error) {
	var docs []models.Document
	err := r.db.Where("author_id = ?", authorID).
		Preload("Author").
		Order("created_at DESC").
		Find(&docs).Error
	return docs, err
}

// GetDocumentByID находит документ по ID
func (r *DocumentRepository) GetDocumentByID(id uint) (*models.Document, error) {
	var doc models.Document
	err := r.db.Preload("Author").First(&doc, id).Error
	if err != nil {
		return nil, err
	}
	return &doc, nil
}

// GetDocumentByFilePath находит документ по пути к файлу
func (r *DocumentRepository) GetDocumentByFilePath(filePath string) (*models.Document, error) {
	var doc models.Document
	err := r.db.Where("file_path = ?", filePath).First(&doc).Error
	if err != nil {
		return nil, err
	}
	return &doc, nil
}

// UpdateDocumentStatus обновляет статус документа
func (r *DocumentRepository) UpdateDocumentStatus(id uint, status models.DocumentStatus) error {
	return r.db.Model(&models.Document{}).
		Where("id = ?", id).
		Update("current_status", status).Error
}