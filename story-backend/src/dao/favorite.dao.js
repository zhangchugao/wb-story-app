'use strict';

const db = require('../db');

function listByUser(userId) {
  return db.prepare(`
    SELECT s.id, s.title, s.author, s.cover_url, s.duration, s.play_count, f.created_at
    FROM favorites f
    JOIN stories s ON s.id = f.story_id
    WHERE f.user_id = ? AND s.status = 1
    ORDER BY f.created_at DESC
  `).all(userId);
}

function isFavorited(userId, storyId) {
  return !!db.prepare('SELECT 1 FROM favorites WHERE user_id = ? AND story_id = ?').get(userId, storyId);
}

function add(userId, storyId) {
  db.prepare('INSERT OR IGNORE INTO favorites (user_id, story_id) VALUES (?, ?)').run(userId, storyId);
}

function remove(userId, storyId) {
  db.prepare('DELETE FROM favorites WHERE user_id = ? AND story_id = ?').run(userId, storyId);
}

module.exports = { listByUser, isFavorited, add, remove };
