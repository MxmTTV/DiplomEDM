package handler

import (
	"DiplomEDM/backend/internal/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type HistoryHandler struct {
	service *service.HistoryService
}

func NewHistoryHandler(service *service.HistoryService) *HistoryHandler {
	return &HistoryHandler{service: service}
}

func (h *HistoryHandler) GetDocumentHistory(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid document id"})
		return
	}

	history, err := h.service.GetDocumentHistory(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"history": history,
	})
}
