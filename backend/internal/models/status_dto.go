package models

type ChangeStatusRequest struct {
	Status  string `json:"status" binding:"required"`
	Comment string `json:"comment"` // ✅ Нет required - уже необязательный
}
