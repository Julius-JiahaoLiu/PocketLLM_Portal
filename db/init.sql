CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
    id UUID PRIMARY KEY,
    user_id UUID,  -- 移除外键约束，支持任意 user_id
    title VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    role VARCHAR(20),
    content TEXT,
    rating VARCHAR(10),
    pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create an index for full-text search on message content
CREATE INDEX idx_messages_content_search ON messages USING GIN (to_tsvector('english', content));

-- Insert a development user so the hard-coded DEFAULT_USER_ID exists in a fresh DB
-- (Use ON CONFLICT DO NOTHING to avoid duplicate errors on re-run)
INSERT INTO users (id, email, password_hash, role) VALUES
('00000000-0000-0000-0000-000000000001', 'dev@example.com', 'nopass', 'user')
ON CONFLICT (id) DO NOTHING;
