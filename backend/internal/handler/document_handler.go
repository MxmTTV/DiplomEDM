package handler

import (
	"DiplomEDM/backend/internal/models"
	"DiplomEDM/backend/internal/service"
	"fmt"
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

// UploadDocument — загрузка файла
func (h *DocumentHandler) UploadDocument(c *gin.Context) {
	authorID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}

	title := c.PostForm("title")
	description := c.PostForm("description")

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

// GetDocumentsWithFilters — основной метод получения документов
func (h *DocumentHandler) GetDocumentsWithFilters(c *gin.Context) {
    // ✅ ПОЛУЧАЕМ ВСЕ ДОКУМЕНТЫ (не только свои!)
    docs, err := h.service.GetAllDocuments()  // или GetDocumentsWithFilters
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "documents": docs,
        "count":     len(docs),
    })
}

// GetDocumentByID
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
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, doc)
}

// DownloadDocument
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
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	if _, err := os.Stat(doc.FilePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "file not found on server"})
		return
	}

	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", doc.FileName))
	c.Header("Content-Type", doc.MimeType)
	c.File(doc.FilePath)
}

// ChangeStatus
func (h *DocumentHandler) ChangeStatus(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userRole, _ := c.Get("user_role")
	roleStr := userRole.(string)

	var req models.ChangeStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid document id"})
		return
	}

	updatedDoc, err := h.service.ChangeStatus(uint(id), userID.(uint), &req, roleStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "status changed successfully",
		"document": updatedDoc,
	})
}
