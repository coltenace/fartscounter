CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    delete_token_hash TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_posts_created_at
ON posts(created_at DESC);
