package handler

import (
	"DiplomEDM/backend/internal/models"
	"DiplomEDM/backend/internal/service"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/gin-gonic/gin"
)

type DocumentHandler struct {
	service *service.DocumentService
}

func NewDocumentHandler(service *service.DocumentService) *DocumentHandler {
	return &DocumentHandler{service: service}
}

// UploadDocument обрабатывает загрузку файла
func (h *DocumentHandler) UploadDocument(c *gin.Context) {
	// Получаем данные пользователя из контекста
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

	// Путь для сохранения
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

// DownloadDocument отдаёт файл на скачивание
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

// ChangeStatusRequest структура запроса на смену статуса
type ChangeStatusRequest struct {
	Status  string `json:"status" binding:"required"`
	Comment string `json:"comment"`
}

// / ChangeStatus обрабатывает смену статуса документа
func (h *DocumentHandler) ChangeStatus(c *gin.Context) {
	// 🐛 ЛОГ: начало
	log.Printf("🔍 ========== ChangeStatus START ==========")

	// Получаем данные пользователя
	userID, exists := c.Get("user_id")
	if !exists {
		log.Printf("❌ No user_id in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userRole, _ := c.Get("user_role")
	roleStr, _ := userRole.(string)

	log.Printf("🔍 userID=%v, roleStr='%s' (len=%d)", userID, roleStr, len(roleStr))

	// Парсим запрос
	var req ChangeStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("❌ JSON parse error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("🔍 req.Status='%s', req.Comment='%s'", req.Status, req.Comment)

	// Получаем ID документа
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		log.Printf("❌ Invalid ID: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid document id"})
		return
	}

	log.Printf("🔍 doc_id=%d", id)

	// Создаём запрос для сервиса
	serviceReq := &models.ChangeStatusRequest{
		Status:  req.Status,
		Comment: req.Comment,
	}

	log.Printf("🔍 Calling service...")

	// Вызываем сервис (ПРОВЕРКИ ВНУТРИ СЕРВИСА)
	updatedDoc, err := h.service.ChangeStatus(uint(id), userID.(uint), serviceReq, roleStr)
	if err != nil {
		log.Printf("❌ Service error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("✅ Success!")

	c.JSON(http.StatusOK, gin.H{
		"message":  "status changed successfully",
		"document": updatedDoc,
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
			"status":    status,
			"title":     title,
			"date_from": dateFrom,
			"date_to":   dateTo,
		},
	})
}
