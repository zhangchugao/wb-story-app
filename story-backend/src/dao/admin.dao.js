'use strict';

const db = require('../db');

// ============ 管理员 ============
async function findAdmin(username) {
  return db.get('SELECT id, username, password_hash FROM admins WHERE username = ?', [username]);
}

async function findAdminById(id) {
  return db.get('SELECT id, username, created_at FROM admins WHERE id = ?', [id]);
}

// ============ 统计 ============
async function stats() {
  const storyCount = Number((await db.get('SELECT COUNT(*) AS n FROM stories')).n);
  const onlineCount = Number((await db.get('SELECT COUNT(*) AS n FROM stories WHERE status = 1')).n);
  const userCount = Number((await db.get('SELECT COUNT(*) AS n FROM users')).n);
  const favoriteCount = Number((await db.get('SELECT COUNT(*) AS n FROM favorites')).n);
  const totalPlays = Number((await db.get('SELECT COALESCE(SUM(play_count), 0) AS n FROM stories')).n);
  const historyCount = Number((await db.get('SELECT COUNT(*) AS n FROM play_history')).n);
  const byCategory = await db.query(`
    SELECT c.name AS name, COUNT(s.id) AS value
    FROM categories c LEFT JOIN stories s ON s.category_id = c.id
    GROUP BY c.id ORDER BY c.sort_order ASC
  `);
  const topStories = await db.query('SELECT id, title, play_count FROM stories ORDER BY play_count DESC LIMIT 5');
  return { storyCount, onlineCount, userCount, favoriteCount, totalPlays, historyCount, byCategory, topStories };
}

// ============ 故事管理 ============
async function listStories({ page, pageSize, keyword, categoryId, status }) {
  const where = [];
  const args = [];
  if (keyword) { where.push('(title LIKE ? OR author LIKE ?)'); const k = `%${keyword}%`; args.push(k, k); }
  if (categoryId) { where.push('category_id = ?'); args.push(categoryId); }
  if (status !== undefined && status !== '') { where.push('status = ?'); args.push(Number(status)); }
  const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const total = Number((await db.get(`SELECT COUNT(*) AS n FROM stories ${clause}`, args)).n);
  const rows = await db.query(`
    SELECT s.*, c.name AS category_name
    FROM stories s LEFT JOIN categories c ON c.id = s.category_id
    ${clause}
    ORDER BY s.sort_order DESC, s.id DESC
    LIMIT ? OFFSET ?
  `, [...args, pageSize, (page - 1) * pageSize]);
  return { total, page, pageSize, list: rows };
}

async function findStory(id) {
  return db.get('SELECT * FROM stories WHERE id = ?', [id]);
}

async function createStory(data) {
  const fields = ['title', 'author', 'narrator', 'category_id', 'cover_url', 'description', 'audio_url', 'duration', 'status', 'sort_order'];
  const values = fields.map((f) => data[f] === undefined ? null : data[f]);
  const sql = `INSERT INTO stories (${fields.join(',')}) VALUES (${fields.map(() => '?').join(',')})`;
  const info = await db.run(sql, values);
  return findStory(info.insertId);
}

async function updateStory(id, data) {
  const allowed = ['title', 'author', 'narrator', 'category_id', 'cover_url', 'description', 'audio_url', 'duration', 'status', 'sort_order'];
  const sets = [];
  const args = [];
  allowed.forEach((f) => {
    if (data[f] !== undefined) { sets.push(`${f} = ?`); args.push(data[f]); }
  });
  if (!sets.length) return findStory(id);
  args.push(id);
  await db.run(`UPDATE stories SET ${sets.join(', ')} WHERE id = ?`, args);
  return findStory(id);
}

async function deleteStory(id) {
  await db.run('DELETE FROM stories WHERE id = ?', [id]);
}

async function setStoryStatus(id, status) {
  await db.run('UPDATE stories SET status = ? WHERE id = ?', [status, id]);
  return findStory(id);
}

// ============ 分集管理 ============
async function episodesOf(storyId) {
  return db.query('SELECT * FROM episodes WHERE story_id = ? ORDER BY episode_no ASC', [storyId]);
}

async function createEpisode(storyId, data) {
  const info = await db.run(`
    INSERT INTO episodes (story_id, title, episode_no, audio_url, duration)
    VALUES (?, ?, ?, ?, ?)
  `, [storyId, data.title, data.episode_no, data.audio_url || '', data.duration || 0]);
  return db.get('SELECT * FROM episodes WHERE id = ?', [info.insertId]);
}

async function updateEpisode(id, data) {
  const sets = [];
  const args = [];
  ['title', 'episode_no', 'audio_url', 'duration'].forEach((f) => {
    if (data[f] !== undefined) { sets.push(`${f} = ?`); args.push(data[f]); }
  });
  if (!sets.length) return db.get('SELECT * FROM episodes WHERE id = ?', [id]);
  args.push(id);
  await db.run(`UPDATE episodes SET ${sets.join(', ')} WHERE id = ?`, args);
  return db.get('SELECT * FROM episodes WHERE id = ?', [id]);
}

async function deleteEpisode(id) {
  await db.run('DELETE FROM episodes WHERE id = ?', [id]);
}

// ============ 分类管理 ============
async function allCategories() {
  return db.query('SELECT * FROM categories ORDER BY sort_order ASC, id ASC');
}

async function createCategory(data) {
  const info = await db.run('INSERT INTO categories (name, icon, sort_order) VALUES (?, ?, ?)', [data.name, data.icon || '', data.sort_order || 0]);
  return db.get('SELECT * FROM categories WHERE id = ?', [info.insertId]);
}

async function updateCategory(id, data) {
  const sets = [];
  const args = [];
  ['name', 'icon', 'sort_order'].forEach((f) => {
    if (data[f] !== undefined) { sets.push(`${f} = ?`); args.push(data[f]); }
  });
  if (!sets.length) return db.get('SELECT * FROM categories WHERE id = ?', [id]);
  args.push(id);
  await db.run(`UPDATE categories SET ${sets.join(', ')} WHERE id = ?`, args);
  return db.get('SELECT * FROM categories WHERE id = ?', [id]);
}

async function deleteCategory(id) {
  const used = Number((await db.get('SELECT COUNT(*) AS n FROM stories WHERE category_id = ?', [id])).n);
  if (used > 0) return false;
  await db.run('DELETE FROM categories WHERE id = ?', [id]);
  return true;
}

// ============ 热搜词 ============
async function allHotKeywords() {
  return db.query('SELECT * FROM hot_keywords ORDER BY weight DESC, sort_order ASC');
}

async function createHotKeyword(data) {
  const info = await db.run('INSERT INTO hot_keywords (keyword, weight, sort_order) VALUES (?, ?, ?)', [data.keyword, data.weight || 0, data.sort_order || 0]);
  return db.get('SELECT * FROM hot_keywords WHERE id = ?', [info.insertId]);
}

async function deleteHotKeyword(id) {
  await db.run('DELETE FROM hot_keywords WHERE id = ?', [id]);
}

// ============ 用户 ============
async function listUsers({ page, pageSize, keyword }) {
  const where = [];
  const args = [];
  if (keyword) { where.push('(nickname LIKE ? OR openid LIKE ?)'); const k = `%${keyword}%`; args.push(k, k); }
  const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const total = Number((await db.get(`SELECT COUNT(*) AS n FROM users ${clause}`, args)).n);
  const rows = await db.query(`
    SELECT id, openid, nickname, avatar_url, created_at,
      (SELECT COUNT(*) FROM favorites f WHERE f.user_id = users.id) AS favorite_count,
      (SELECT COUNT(*) FROM play_history h WHERE h.user_id = users.id) AS history_count
    FROM users ${clause}
    ORDER BY id DESC LIMIT ? OFFSET ?
  `, [...args, pageSize, (page - 1) * pageSize]);
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
