package models

type ChangeStatusRequest struct {
	Status  string `json:"status" binding:"required,oneof=draft pending approved rejected archived"`
	Comment string `json:"comment"`
}