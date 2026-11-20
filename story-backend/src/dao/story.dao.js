'use strict';

const db = require('../db');

const STORY_FIELDS = `
  id, title, author, narrator, category_id, cover_url, description,
  audio_url, duration, play_count, status, sort_order, created_at
`;

function list({ categoryId, keyword, page, pageSize, sort }) {
  const where = ['status = 1'];
  const args = [];
  if (categoryId) { where.push('category_id = ?'); args.push(categoryId); }
  if (keyword) { where.push('(title LIKE ? OR author LIKE ? OR description LIKE ?)'); const k = `%${keyword}%`; args.push(k, k, k); }

  const order = sort === 'hot' ? 'play_count DESC' : sort === 'new' ? 'created_at DESC' : 'sort_order DESC, id DESC';
  const offset = (page - 1) * pageSize;
  const total = db.prepare(`SELECT COUNT(*) AS n FROM stories WHERE ${where.join(' AND ')}`).get(...args).n;
  const rows = db.prepare(
    `SELECT ${STORY_FIELDS} FROM stories WHERE ${where.join(' AND ')} ORDER BY ${order} LIMIT ? OFFSET ?`
  ).all(...args, pageSize, offset);
  return { total, page, pageSize, list: rows };
}

function hot(limit) {
  return db.prepare(`SELECT ${STORY_FIELDS} FROM stories WHERE status = 1 ORDER BY play_count DESC LIMIT ?`).all(limit);
}

function findById(id) {
  return db.prepare(`SELECT ${STORY_FIELDS} FROM stories WHERE id = ? AND status = 1`).get(id);
}

function episodesOf(storyId) {
  return db.prepare(
    'SELECT id, story_id, title, episode_no, audio_url, duration FROM episodes WHERE story_id = ? ORDER BY episode_no ASC'
  ).all(storyId);
}

function incrPlayCount(id) {
  db.prepare('UPDATE stories SET play_count = play_count + 1 WHERE id = ?').run(id);
}

function hotKeywords(limit) {
  return db.prepare('SELECT keyword FROM hot_keywords ORDER BY weight DESC, sort_order ASC LIMIT ?').all(limit).map((r) => r.keyword);
}

module.exports = { list, hot, findById, episodesOf, incrPlayCount, hotKeywords };
