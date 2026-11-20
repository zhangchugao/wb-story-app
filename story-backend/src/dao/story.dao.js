'use strict';

const db = require('../db');

const STORY_FIELDS = `
  id, title, author, narrator, category_id, cover_url, description,
  audio_url, duration, play_count, status, sort_order, created_at
`;

async function list({ categoryId, keyword, page, pageSize, sort }) {
  const where = ['status = 1'];
  const args = [];
  if (categoryId) { where.push('category_id = ?'); args.push(categoryId); }
  if (keyword) { where.push('(title LIKE ? OR author LIKE ? OR description LIKE ?)'); const k = `%${keyword}%`; args.push(k, k, k); }

  const order = sort === 'hot' ? 'play_count DESC' : sort === 'new' ? 'created_at DESC' : 'sort_order DESC, id DESC';
  const clause = where.join(' AND ');
  const offset = (page - 1) * pageSize;
  const totalRow = await db.get(`SELECT COUNT(*) AS n FROM stories WHERE ${clause}`, args);
  const rows = await db.query(
    `SELECT ${STORY_FIELDS} FROM stories WHERE ${clause} ORDER BY ${order} LIMIT ? OFFSET ?`,
    [...args, pageSize, offset]
  );
  return { total: Number(totalRow.n), page, pageSize, list: rows };
}

async function hot(limit) {
  return db.query(`SELECT ${STORY_FIELDS} FROM stories WHERE status = 1 ORDER BY play_count DESC LIMIT ?`, [limit]);
}

async function findById(id) {
  return db.get(`SELECT ${STORY_FIELDS} FROM stories WHERE id = ? AND status = 1`, [id]);
}

async function episodesOf(storyId) {
  return db.query(
    'SELECT id, story_id, title, episode_no, audio_url, duration FROM episodes WHERE story_id = ? ORDER BY episode_no ASC',
    [storyId]
  );
}

async function incrPlayCount(id) {
  await db.run('UPDATE stories SET play_count = play_count + 1 WHERE id = ?', [id]);
}

async function hotKeywords(limit) {
  const rows = await db.query('SELECT keyword FROM hot_keywords ORDER BY weight DESC, sort_order ASC LIMIT ?', [limit]);
  return rows.map((r) => r.keyword);
}

module.exports = { list, hot, findById, episodesOf, incrPlayCount, hotKeywords };
