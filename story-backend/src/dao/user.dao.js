'use strict';

const db = require('../db');

async function findByOpenid(openid) {
  return db.get('SELECT id, openid, union_id, nickname, avatar_url FROM users WHERE openid = ?', [openid]);
}

async function findById(id) {
  return db.get('SELECT id, openid, union_id, nickname, avatar_url FROM users WHERE id = ?', [id]);
}

async function create({ openid, unionId = '', nickname = '听友', avatarUrl = '' }) {
  const info = await db.run(
    'INSERT INTO users (openid, union_id, nickname, avatar_url) VALUES (?, ?, ?, ?)',
    [openid, unionId, nickname, avatarUrl]
  );
  return findById(info.insertId);
}

async function updateProfile(id, { nickname, avatarUrl }) {
  const sets = [];
  const args = [];
  if (nickname !== undefined) { sets.push('nickname = ?'); args.push(nickname); }
  if (avatarUrl !== undefined) { sets.push('avatar_url = ?'); args.push(avatarUrl); }
  if (sets.length) {
    args.push(id);
    await db.run(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, args);
  }
  return findById(id);
}

module.exports = { findByOpenid, findById, create, updateProfile };
