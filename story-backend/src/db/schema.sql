-- MySQL 版表结构（MySQL 5.7+，utf8mb4）
-- 说明：CREATE INDEX 不支持 IF NOT EXISTS，重复建索引的报错在 db/index.js 中忽略

CREATE TABLE IF NOT EXISTS categories (
  id          INT          NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  icon        VARCHAR(50)  DEFAULT '',
  sort_order  INT          DEFAULT 0,
  created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stories (
  id           INT           NOT NULL AUTO_INCREMENT,
  title        VARCHAR(200)  NOT NULL,
  author       VARCHAR(100)  DEFAULT '',
  narrator     VARCHAR(100)  DEFAULT '',
  category_id  INT           DEFAULT NULL,
  cover_url    VARCHAR(500)  DEFAULT '',
  description  TEXT,
  audio_url    VARCHAR(500)  DEFAULT '',
  duration     INT           DEFAULT 0,
  play_count   INT           DEFAULT 0,
  status       TINYINT       DEFAULT 1,
  sort_order   INT           DEFAULT 0,
  created_at   DATETIME      DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_category (category_id),
  KEY idx_status_sort (status, sort_order),
  CONSTRAINT fk_story_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS episodes (
  id          INT          NOT NULL AUTO_INCREMENT,
  story_id    INT          NOT NULL,
  title       VARCHAR(200) NOT NULL,
  episode_no  INT          NOT NULL,
  audio_url   VARCHAR(500) DEFAULT '',
  duration    INT          DEFAULT 0,
  created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_episode_story (story_id, episode_no),
  CONSTRAINT fk_episode_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id          INT          NOT NULL AUTO_INCREMENT,
  openid      VARCHAR(100) NOT NULL,
  union_id    VARCHAR(100) DEFAULT '',
  nickname    VARCHAR(100) DEFAULT '听友',
  avatar_url  VARCHAR(500) DEFAULT '',
  created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_openid (openid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS favorites (
  id          INT      NOT NULL AUTO_INCREMENT,
  user_id     INT      NOT NULL,
  story_id    INT      NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_story (user_id, story_id),
  CONSTRAINT fk_fav_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_fav_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS play_history (
  id          INT      NOT NULL AUTO_INCREMENT,
  user_id     INT      NOT NULL,
  story_id    INT      NOT NULL,
  episode_id  INT      DEFAULT NULL,
  position    INT      DEFAULT 0,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_history_user_story (user_id, story_id),
  CONSTRAINT fk_hist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_hist_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hot_keywords (
  id          INT          NOT NULL AUTO_INCREMENT,
  keyword     VARCHAR(100) NOT NULL,
  weight      INT          DEFAULT 0,
  sort_order  INT          DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admins (
  id            INT          NOT NULL AUTO_INCREMENT,
  username      VARCHAR(100) NOT NULL,
  password_hash VARCHAR(128) NOT NULL,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
