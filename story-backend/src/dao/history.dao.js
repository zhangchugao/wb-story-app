'use strict';

const db = require('../db');

function listByUser(userId, limit) {
  return db.prepare(`
    SELECT s.id, s.title, s.author, s.cover_url, s.duration,
           h.position, h.episode_id, h.updated_at
    FROM play_history h
    JOIN stories s ON s.id = h.story_id
    WHERE h.user_id = ? AND s.status = 1
    ORDER BY h.updated_at DESC
    LIMIT ?
  `).all(userId, limit);
}

function getProgress(userId, storyId) {
  return db.prepare(
    'SELECT story_id, episode_id, position, updated_at FROM play_history WHERE user_id = ? AND story_id = ?'
  ).get(userId, storyId);
}

function upsertProgress(userId, storyId, episodeId, position) {
  db.prepare(`
    INSERT INTO play_history (user_id, story_id, episode_id, position, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, story_id) DO UPDATE SET
      episode_id = excluded.episode_id,
      position = excluded.position,
      updated_at = datetime('now')
  `).run(userId, storyId, episodeId, position);
}

function remove(userId, storyId) {
  db.prepare('DELETE FROM play_history WHERE user_id = ? AND story_id = ?').run(userId, storyId);
}

function clear(userId) {
  db.prepare('DELETE FROM play_history WHERE user_id = ?').run(userId);
}

module.exports = { listByUser, getProgress, upsertProgress, remove, clear };
