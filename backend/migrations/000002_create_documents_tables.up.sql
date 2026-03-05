-- Таблица статусов документов (справочник)
CREATE TABLE document_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL
);

-- Заполняем статусами
INSERT INTO document_statuses (name, code) VALUES
    ('Создан', 'draft'),
    ('На согласовании', 'pending'),
    ('Утверждён', 'approved'),
    ('Отклонён', 'rejected'),
    ('Архивирован', 'archived');

-- Таблица документов
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_status_code VARCHAR(50) NOT NULL DEFAULT 'draft' REFERENCES document_statuses(code),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для поиска и фильтрации
CREATE INDEX idx_documents_author ON documents(author_id);
CREATE INDEX idx_documents_status ON documents(current_status_code);
CREATE INDEX idx_documents_created ON documents(created_at);

-- Таблица истории изменений (Аудит)
CREATE TABLE document_history (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- 'created', 'status_changed', 'commented'
    comment TEXT,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_history_document ON document_history(document_id);

-- Таблица маршрутов согласования
CREATE TABLE approval_routes (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_approval_document ON approval_routes(document_id);