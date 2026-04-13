-- ============================================
-- МИГРАЦИЯ 003: Обновление ролей и статусов
-- ============================================

-- 1. Обновляем тип колонки role (уже VARCHAR(50), но на всякий случай)
ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(50);

-- 2. Обновляем роль существующему пользователю
UPDATE users SET role = 'director' WHERE role = 'admin';

-- 3. Добавляем новых пользователей
-- Пароль '123456' хэширован через bcrypt
INSERT INTO users (email, password_hash, full_name, role, created_at, updated_at)
VALUES 
    (
        'director@school.local', 
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 
        'Иванов Иван Иванович', 
        'director', 
        NOW(), 
        NOW()
    ),
    (
        'secretary@school.local', 
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 
        'Петрова Анна Сергеевна', 
        'secretary', 
        NOW(), 
        NOW()
    ),
    (
        'zavuch@school.local', 
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 
        'Сидоров Петр Петрович', 
        'zavuch', 
        NOW(), 
        NOW()
    ),
    (
        'teacher@school.local', 
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 
        'Смирнова Елена Владимировна', 
        'teacher', 
        NOW(), 
        NOW()
    )
ON CONFLICT (email) DO NOTHING;

-- 4. Обновляем статусы документов (pending → review, archived → completed)
UPDATE documents SET current_status_code = 'review' WHERE current_status_code = 'pending';
UPDATE documents SET current_status_code = 'completed' WHERE current_status_code = 'archived';

-- 5. Создаём индексы (если их нет)
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(current_status_code);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 6. Проверяем результат
SELECT '=== USERS ===' AS info;
SELECT id, email, full_name, role FROM users;

SELECT '=== DOCUMENT STATUSES ===' AS info;
SELECT DISTINCT current_status_code FROM documents;