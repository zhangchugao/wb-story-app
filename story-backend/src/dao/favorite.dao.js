'use strict';

const db = require('../db');

async function listByUser(userId) {
  return db.query(`
    SELECT s.id, s.title, s.author, s.cover_url, s.duration, s.play_count, f.created_at
    FROM favorites f
    JOIN stories s ON s.id = f.story_id
    WHERE f.user_id = ? AND s.status = 1
    ORDER BY f.created_at DESC
  `, [userId]);
}

async function isFavorited(userId, storyId) {
  const row = await db.get('SELECT 1 FROM favorites WHERE user_id = ? AND story_id = ?', [userId, storyId]);
  return !!row;
}

async function add(userId, storyId) {
  await db.run('INSERT IGNORE INTO favorites (user_id, story_id) VALUES (?, ?)', [userId, storyId]);
}

async function remove(userId, storyId) {
  await db.run('DELETE FROM favorites WHERE user_id = ? AND story_id = ?', [userId, storyId]);
}

module.exports = { listByUser, isFavorited, add, remove };
