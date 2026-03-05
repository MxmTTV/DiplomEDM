-- Создаем тип данных для ролей
CREATE TYPE user_role AS ENUM ('admin', 'employee');

-- Таблица пользователей
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'employee',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрого поиска по email (для логина)
CREATE INDEX idx_users_email ON users(email);

-- Создаем начального администратора
-- Логин: admin@edms.local, Пароль: admin123 (хеш заготовлен заранее для примера)
INSERT INTO users (email, password_hash, full_name, role) 
VALUES ('admin@edms.local', '$2a$10$X7...хеш_пароля_admin123...', 'Системный Администратор', 'admin');