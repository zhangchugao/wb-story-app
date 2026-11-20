'use strict';

const db = require('../db');

// ============ 管理员 ============
function findAdmin(username) {
  return db.prepare('SELECT id, username, password_hash FROM admins WHERE username = ?').get(username);
}

function findAdminById(id) {
  return db.prepare('SELECT id, username, created_at FROM admins WHERE id = ?').get(id);
}

// ============ 统计 ============
function stats() {
  const storyCount = db.prepare('SELECT COUNT(*) AS n FROM stories').get().n;
  const onlineCount = db.prepare('SELECT COUNT(*) AS n FROM stories WHERE status = 1').get().n;
  const userCount = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  const favoriteCount = db.prepare('SELECT COUNT(*) AS n FROM favorites').get().n;
  const totalPlays = db.prepare('SELECT COALESCE(SUM(play_count), 0) AS n FROM stories').get().n;
  const historyCount = db.prepare('SELECT COUNT(*) AS n FROM play_history').get().n;
  const byCategory = db.prepare(`
    SELECT c.name AS name, COUNT(s.id) AS value
    FROM categories c LEFT JOIN stories s ON s.category_id = c.id
    GROUP BY c.id ORDER BY c.sort_order ASC
  `).all();
  const topStories = db.prepare(`
    SELECT id, title, play_count FROM stories ORDER BY play_count DESC LIMIT 5
  `).all();
  return {
    storyCount, onlineCount, userCount, favoriteCount, totalPlays, historyCount,
    byCategory, topStories,
  };
}

// ============ 故事管理 ============
function listStories({ page, pageSize, keyword, categoryId, status }) {
  const where = [];
  const args = [];
  if (keyword) { where.push('(title LIKE ? OR author LIKE ?)'); const k = `%${keyword}%`; args.push(k, k); }
  if (categoryId) { where.push('category_id = ?'); args.push(categoryId); }
  if (status !== undefined && status !== '') { where.push('status = ?'); args.push(Number(status)); }
  const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const total = db.prepare(`SELECT COUNT(*) AS n FROM stories ${clause}`).get(...args).n;
  const rows = db.prepare(`
    SELECT s.*, c.name AS category_name
    FROM stories s LEFT JOIN categories c ON c.id = s.category_id
    ${clause}
    ORDER BY s.sort_order DESC, s.id DESC
    LIMIT ? OFFSET ?
  `).all(...args, pageSize, (page - 1) * pageSize);
  return { total, page, pageSize, list: rows };
}

function findStory(id) {
  return db.prepare('SELECT * FROM stories WHERE id = ?').get(id);
}

function createStory(data) {
  const fields = ['title', 'author', 'narrator', 'category_id', 'cover_url', 'description', 'audio_url', 'duration', 'status', 'sort_order'];
  const values = fields.map((f) => data[f] === undefined ? null : data[f]);
  const sql = `INSERT INTO stories (${fields.join(',')}) VALUES (${fields.map(() => '?').join(',')})`;
  const info = db.prepare(sql).run(...values);
  return findStory(info.lastInsertRowid);
}

function updateStory(id, data) {
  const allowed = ['title', 'author', 'narrator', 'category_id', 'cover_url', 'description', 'audio_url', 'duration', 'status', 'sort_order'];
  const sets = [];
  const args = [];
  allowed.forEach((f) => {
    if (data[f] !== undefined) { sets.push(`${f} = ?`); args.push(data[f]); }
  });
  if (!sets.length) return findStory(id);
  sets.push("updated_at = datetime('now')");
  args.push(id);
  db.prepare(`UPDATE stories SET ${sets.join(', ')} WHERE id = ?`).run(...args);
  return findStory(id);
}

function deleteStory(id) {
  db.prepare('DELETE FROM stories WHERE id = ?').run(id);
}

function setStoryStatus(id, status) {
  db.prepare("UPDATE stories SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
  return findStory(id);
}

// ============ 分集管理 ============
function episodesOf(storyId) {
  return db.prepare('SELECT * FROM episodes WHERE story_id = ? ORDER BY episode_no ASC').all(storyId);
}

function createEpisode(storyId, data) {
  const info = db.prepare(`
    INSERT INTO episodes (story_id, title, episode_no, audio_url, duration)
    VALUES (?, ?, ?, ?, ?)
  `).run(storyId, data.title, data.episode_no, data.audio_url || '', data.duration || 0);
  return db.prepare('SELECT * FROM episodes WHERE id = ?').get(info.lastInsertRowid);
}

function updateEpisode(id, data) {
  const sets = [];
  const args = [];
  ['title', 'episode_no', 'audio_url', 'duration'].forEach((f) => {
    if (data[f] !== undefined) { sets.push(`${f} = ?`); args.push(data[f]); }
  });
  if (!sets.length) return db.prepare('SELECT * FROM episodes WHERE id = ?').get(id);
  args.push(id);
  db.prepare(`UPDATE episodes SET ${sets.join(', ')} WHERE id = ?`).run(...args);
  return db.prepare('SELECT * FROM episodes WHERE id = ?').get(id);
}

function deleteEpisode(id) {
  db.prepare('DELETE FROM episodes WHERE id = ?').run(id);
}

// ============ 分类管理 ============
function allCategories() {
  return db.prepare('SELECT * FROM categories ORDER BY sort_order ASC, id ASC').all();
}

function createCategory(data) {
  const info = db.prepare('INSERT INTO categories (name, icon, sort_order) VALUES (?, ?, ?)')
    .run(data.name, data.icon || '', data.sort_order || 0);
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(info.lastInsertRowid);
}

function updateCategory(id, data) {
  const sets = [];
  const args = [];
  ['name', 'icon', 'sort_order'].forEach((f) => {
    if (data[f] !== undefined) { sets.push(`${f} = ?`); args.push(data[f]); }
  });
  if (!sets.length) return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  args.push(id);
  db.prepare(`UPDATE categories SET ${sets.join(', ')} WHERE id = ?`).run(...args);
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
}

function deleteCategory(id) {
  const used = db.prepare('SELECT COUNT(*) AS n FROM stories WHERE category_id = ?').get(id).n;
  if (used > 0) return false;
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  return true;
}

// ============ 热搜词 ============
function allHotKeywords() {
  return db.prepare('SELECT * FROM hot_keywords ORDER BY weight DESC, sort_order ASC').all();
}

function createHotKeyword(data) {
  const info = db.prepare('INSERT INTO hot_keywords (keyword, weight, sort_order) VALUES (?, ?, ?)')
    .run(data.keyword, data.weight || 0, data.sort_order || 0);
  return db.prepare('SELECT * FROM hot_keywords WHERE id = ?').get(info.lastInsertRowid);
}

function deleteHotKeyword(id) {
  db.prepare('DELETE FROM hot_keywords WHERE id = ?').run(id);
}

// ============ 用户 ============
function listUsers({ page, pageSize, keyword }) {
  const where = [];
  const args = [];
  if (keyword) { where.push('(nickname LIKE ? OR openid LIKE ?)'); const k = `%${keyword}%`; args.push(k, k); }
  const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const total = db.prepare(`SELECT COUNT(*) AS n FROM users ${clause}`).get(...args).n;
  const rows = db.prepare(`
    SELECT id, openid, nickname, avatar_url, created_at,
      (SELECT COUNT(*) FROM favorites f WHERE f.user_id = users.id) AS favorite_count,
      (SELECT COUNT(*) FROM play_history h WHERE h.user_id = users.id) AS history_count
    FROM users ${clause}
    ORDER BY id DESC LIMIT ? OFFSET ?
  `).all(...args, pageSize, (page - 1) * pageSize);
  return { total, page, pageSize, list: rows };
}

module.exports = {
  findAdmin, findAdminById, stats,
  listStories, findStory, createStory, updateStory, deleteStory, setStoryStatus,
  episodesOf, createEpisode, updateEpisode, deleteEpisode,
  allCategories, createCategory, updateCategory, deleteCategory,
  allHotKeywords, createHotKeyword, deleteHotKeyword,
  listUsers,
};
