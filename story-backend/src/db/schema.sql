-- 分类表
CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  icon        TEXT,
  sort_order  INTEGER DEFAULT 0,
  created_at  TEXT    DEFAULT (datetime('now'))
);

-- 故事表
CREATE TABLE IF NOT EXISTS stories (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT    NOT NULL,
  author       TEXT    DEFAULT '',
  narrator     TEXT    DEFAULT '',
  category_id  INTEGER,
  cover_url    TEXT    DEFAULT '',
  description  TEXT    DEFAULT '',
  audio_url    TEXT    DEFAULT '',
  duration     INTEGER DEFAULT 0,          -- 总时长（秒）
  play_count   INTEGER DEFAULT 0,
  status       INTEGER DEFAULT 1,          -- 1 上架 0 下架
  sort_order   INTEGER DEFAULT 0,
  created_at   TEXT    DEFAULT (datetime('now')),
  updated_at   TEXT    DEFAULT (datetime('now')),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 分集表（长故事按集播放）
CREATE TABLE IF NOT EXISTS episodes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  story_id    INTEGER NOT NULL,
  title       TEXT    NOT NULL,
  episode_no  INTEGER NOT NULL,
  audio_url   TEXT    DEFAULT '',
  duration    INTEGER DEFAULT 0,
  created_at  TEXT    DEFAULT (datetime('now')),
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  openid      TEXT    NOT NULL UNIQUE,
  union_id    TEXT    DEFAULT '',
  nickname    TEXT    DEFAULT '听友',
  avatar_url  TEXT    DEFAULT '',
  created_at  TEXT    DEFAULT (datetime('now')),
  updated_at  TEXT    DEFAULT (datetime('now'))
);

-- 收藏表
CREATE TABLE IF NOT EXISTS favorites (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL,
  story_id    INTEGER NOT NULL,
  created_at  TEXT    DEFAULT (datetime('now')),
  UNIQUE (user_id, story_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);

-- 播放历史表（每个故事一条，记录最近一次进度，支持断点续听）
CREATE TABLE IF NOT EXISTS play_history (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL,
  story_id    INTEGER NOT NULL,
  episode_id  INTEGER,
  position    INTEGER DEFAULT 0,           -- 播放位置（秒）
  updated_at  TEXT    DEFAULT (datetime('now')),
  UNIQUE (user_id, story_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);

-- 热搜词表
CREATE TABLE IF NOT EXISTS hot_keywords (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword     TEXT    NOT NULL,
  weight      INTEGER DEFAULT 0,
  sort_order  INTEGER DEFAULT 0
);

-- 管理员表
CREATE TABLE IF NOT EXISTS admins (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  username     TEXT    NOT NULL UNIQUE,
  password_hash TEXT   NOT NULL,
  created_at   TEXT    DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_stories_category ON stories(category_id);
CREATE INDEX IF NOT EXISTS idx_stories_status_sort ON stories(status, sort_order);
CREATE INDEX IF NOT EXISTS idx_episodes_story ON episodes(story_id, episode_no);
CREATE INDEX IF NOT EXISTS idx_history_user_updated ON play_history(user_id, updated_at);
