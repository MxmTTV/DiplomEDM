package service

import (
	"DiplomEDM/backend/internal/models"
	"DiplomEDM/backend/internal/repository"
	"DiplomEDM/backend/internal/utils"
	"errors"
)

type UserService struct {
	repo  *repository.UserRepository
	jwtMgr *utils.JWTManager
}

func NewUserService(repo *repository.UserRepository, jwtMgr *utils.JWTManager) *UserService {
	return &UserService{repo: repo, jwtMgr: jwtMgr}
}

// Register регистрирует нового пользователя
func (s *UserService) Register(req *models.RegisterRequest) (*models.AuthResponse, error) {
	// Проверяем, не занят ли email
	existing, err := s.repo.GetUserByEmail(req.Email)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, errors.New("user with this email already exists")
	}

	// Создаём пользователя
	user := &models.User{
		Email:    req.Email,
		FullName: req.FullName,
		Role:     models.RoleEmployee,
	}

	// Хэшируем пароль
	if err := user.HashPassword(req.Password); err != nil {
		return nil, err
	}

	// Сохраняем в БД
	if err := s.repo.CreateUser(user); err != nil {
		return nil, err
	}

	// Генерируем токен
	token, err := s.jwtMgr.GenerateToken(user)
	if err != nil {
		return nil, err
	}

	return &models.AuthResponse{
		Token: token,
		User:  *user,
	}, nil
}

// Login авторизует пользователя
func (s *UserService) Login(req *models.LoginRequest) (*models.AuthResponse, error) {
	// Ищем пользователя
	user, err := s.repo.GetUserByEmail(req.Email)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("invalid email or password")
	}

	// Проверяем пароль
	if err := user.CheckPassword(req.Password); err != nil {
		return nil, errors.New("invalid email or password")
	}

	// Генерируем токен
	token, err := s.jwtMgr.GenerateToken(user)
	if err != nil {
		return nil, err
	}

	return &models.AuthResponse{
		Token: token,
		User:  *user,
	}, nil
}

// GetUserByID получает пользователя по ID
func (s *UserService) GetUserByID(id uint) (*models.User, error) {
	return s.repo.GetUserByID(id)
}