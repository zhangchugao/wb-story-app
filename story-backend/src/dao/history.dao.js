'use strict';

const db = require('../db');

async function listByUser(userId, limit) {
  return db.query(`
    SELECT s.id, s.title, s.author, s.cover_url, s.duration,
           h.position, h.episode_id, h.updated_at
    FROM play_history h
    JOIN stories s ON s.id = h.story_id
    WHERE h.user_id = ? AND s.status = 1
    ORDER BY h.updated_at DESC
    LIMIT ?
  `, [userId, limit]);
}

async function getProgress(userId, storyId) {
  return db.get(
    'SELECT story_id, episode_id, position, updated_at FROM play_history WHERE user_id = ? AND story_id = ?',
    [userId, storyId]
  );
}

async function upsertProgress(userId, storyId, episodeId, position) {
  await db.run(`
    INSERT INTO play_history (user_id, story_id, episode_id, position)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      episode_id = VALUES(episode_id),
      position = VALUES(position)
  `, [userId, storyId, episodeId, position]);
}

async function remove(userId, storyId) {
  await db.run('DELETE FROM play_history WHERE user_id = ? AND story_id = ?', [userId, storyId]);
}

async function clear(userId) {
  await db.run('DELETE FROM play_history WHERE user_id = ?', [userId]);
}

module.exports = { listByUser, getProgress, upsertProgress, remove, clear };
