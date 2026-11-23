ALTER TABLE users ADD COLUMN is_demo boolean NOT NULL DEFAULT false;
CREATE INDEX users_demo_created_idx ON users (created_at) WHERE is_demo = true;
