package handler

import (
	"DiplomEDM/backend/internal/service"
	"DiplomEDM/backend/internal/models"
	"github.com/gin-gonic/gin"
	"net/http"
	"strconv"
	"fmt"
	"os"
)

type DocumentHandler struct {
	service *service.DocumentService
}

func NewDocumentHandler(service *service.DocumentService) *DocumentHandler {
	return &DocumentHandler{service: service}
}

// UploadDocument обрабатывает загрузку файла
func (h *DocumentHandler) UploadDocument(c *gin.Context) {
	// Получаем данные пользователя из контекста (добавлены middleware)
	authorID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Парсим multipart form
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}

	title := c.PostForm("title")
	description := c.PostForm("description")

	// Путь для сохранения (из конфига или дефолт)
	storagePath := "./storage"

	doc, err := h.service.UploadDocument(file, title, description, authorID.(uint), storagePath)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "document uploaded successfully",
		"document": doc,
	})
}

// GetMyDocuments возвращает список документов пользователя
func (h *DocumentHandler) GetMyDocuments(c *gin.Context) {
	userID, _ := c.Get("user_id")

	docs, err := h.service.GetMyDocuments(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"documents": docs,
		"count":     len(docs),
	})
}

// GetDocumentByID возвращает документ по ID
func (h *DocumentHandler) GetDocumentByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid document id"})
		return
	}

	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	doc, err := h.service.GetDocumentByID(uint(id), userID.(uint), userRole.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "document not found"})
		return
	}

	c.JSON(http.StatusOK, doc)
}

/// DownloadDocument отдаёт файл на скачивание
func (h *DocumentHandler) DownloadDocument(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid document id"})
		return
	}

	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	doc, err := h.service.GetDocumentByID(uint(id), userID.(uint), userRole.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "document not found"})
		return
	}

	// Проверяем, существует ли файл
	if _, err := os.Stat(doc.FilePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "file not found on server"})
		return
	}

	// Отдаём файл
	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Transfer-Encoding", "binary")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", doc.FileName))
	c.Header("Content-Type", doc.MimeType)
	c.File(doc.FilePath)
}
// ChangeStatus обрабатывает смену статуса
func (h *DocumentHandler) ChangeStatus(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid document id"})
		return
	}

	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	var req models.ChangeStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	doc, err := h.service.ChangeStatus(uint(id), userID.(uint), &req, userRole.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "status changed successfully",
		"document": doc,
	})
}

// GetDocumentsWithFilters получает документы с фильтрами
func (h *DocumentHandler) GetDocumentsWithFilters(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	// Получаем query параметры
	status := c.Query("status")
	title := c.Query("title")
	dateFrom := c.Query("date_from")
	dateTo := c.Query("date_to")

	docs, err := h.service.GetDocumentsWithFilters(
		userID.(uint),
		userRole.(string),
		status,
		title,
		dateFrom,
		dateTo,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"documents": docs,
		"count":     len(docs),
		"filters": gin.H{
			"status":     status,
			"title":      title,
			"date_from":  dateFrom,
			"date_to":    dateTo,
		},
	})
}