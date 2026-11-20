'use strict';

const db = require('../db');

function findByOpenid(openid) {
  return db.prepare('SELECT id, openid, union_id, nickname, avatar_url FROM users WHERE openid = ?').get(openid);
}

function findById(id) {
  return db.prepare('SELECT id, openid, union_id, nickname, avatar_url FROM users WHERE id = ?').get(id);
}

function create({ openid, unionId = '', nickname = '听友', avatarUrl = '' }) {
  const info = db.prepare(
    'INSERT INTO users (openid, union_id, nickname, avatar_url) VALUES (?, ?, ?, ?)'
  ).run(openid, unionId, nickname, avatarUrl);
  return findById(info.lastInsertRowid);
}

function updateProfile(id, { nickname, avatarUrl }) {
  const sets = [];
  const args = [];
  if (nickname !== undefined) { sets.push('nickname = ?'); args.push(nickname); }
  if (avatarUrl !== undefined) { sets.push('avatar_url = ?'); args.push(avatarUrl); }
  if (sets.length) {
    sets.push("updated_at = datetime('now')");
    args.push(id);
    db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...args);
  }
  return findById(id);
}

module.exports = { findByOpenid, findById, create, updateProfile };
