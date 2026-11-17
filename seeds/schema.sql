-- D1 schema for the Vux blog.
-- Run with:
--   wrangler d1 execute vux --local  --file=./seeds/schema.sql
--   wrangler d1 execute vux --remote --file=./seeds/schema.sql

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name  TEXT,
  is_admin      INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS posts (
  uid             TEXT PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  thumb_text      TEXT,
  thumb_image     TEXT,
  publish_content TEXT,
  draft_content   TEXT,
  is_published    INTEGER NOT NULL DEFAULT 0,
  author_id       TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,
  position        INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS posts_published_idx ON posts(is_published, updated_at, position);
CREATE INDEX IF NOT EXISTS posts_author_idx ON posts(author_id);
CREATE INDEX IF NOT EXISTS posts_slug_idx ON posts(slug);

CREATE TABLE IF NOT EXISTS tags (
  post_uid TEXT NOT NULL REFERENCES posts(uid) ON DELETE CASCADE,
  tag      TEXT NOT NULL,
  PRIMARY KEY (post_uid, tag)
);

CREATE INDEX IF NOT EXISTS tags_tag_idx ON tags(tag);

CREATE TABLE IF NOT EXISTS claps (
  post_uid TEXT PRIMARY KEY REFERENCES posts(uid) ON DELETE CASCADE,
  count    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS comments (
  id          TEXT PRIMARY KEY,
  post_uid    TEXT NOT NULL REFERENCES posts(uid) ON DELETE CASCADE,
  author_id   TEXT REFERENCES users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  content     TEXT NOT NULL,
  created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS comments_post_idx ON comments(post_uid, created_at);

-- Per-client clap cap. ip_hash is a truncated SHA-256, not the raw address.
CREATE TABLE IF NOT EXISTS clap_limits (
  post_uid TEXT NOT NULL,
  ip_hash  TEXT NOT NULL,
  count    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (post_uid, ip_hash)
);

-- Sliding-window counters for login and signup.
CREATE TABLE IF NOT EXISTS auth_attempts (
  bucket       TEXT PRIMARY KEY,
  count        INTEGER NOT NULL,
  window_start INTEGER NOT NULL
);
