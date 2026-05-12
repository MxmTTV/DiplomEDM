package service

import (
	"DiplomEDM/backend/internal/models"
	"DiplomEDM/backend/internal/repository"
	"DiplomEDM/backend/internal/utils"
	"errors"
)

type UserService struct {
	repo   *repository.UserRepository
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

	// ✅ ПРОВЕРКА И ВАЛИДАЦИЯ РОЛИ
	allowedRoles := map[string]bool{
		models.RoleDirector:  true,
		models.RoleSecretary: true,
		models.RoleZavuch:    true,
		models.RoleTeacher:   true,
	}

	// Если роль не передана или недопустима — ставим teacher
	role := req.Role
	if role == "" || !allowedRoles[role] {
		role = models.RoleTeacher
	}

	// Создаём пользователя с ПРАВИЛЬНОЙ ролью
	user := &models.User{
		Email:    req.Email,
		FullName: req.FullName,
		Role:     role, // ← ТЕПЕРЬ БЕРЁМ ИЗ ЗАПРОСА!
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
		Token:    token,
		ID:       user.ID,
		Email:    user.Email,
		FullName: user.FullName,
		Role:     user.Role,
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
		Token:    token,
		ID:       user.ID,
		Email:    user.Email,
		FullName: user.FullName,
		Role:     user.Role,
	}, nil
}

// GetUserByID получает пользователя по ID
func (s *UserService) GetUserByID(id uint) (*models.User, error) {
	return s.repo.GetUserByID(id)
}
