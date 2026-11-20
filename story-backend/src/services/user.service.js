'use strict';

const userDao = require('../dao/user.dao');
const favoriteDao = require('../dao/favorite.dao');
const historyDao = require('../dao/history.dao');
const storyDao = require('../dao/story.dao');
const { notFound, badRequest } = require('../utils/response');

function profile(userId) {
  return userDao.findById(userId);
}

function updateProfile(userId, payload) {
  const patch = {};
  if (payload.nickname !== undefined) {
    const n = String(payload.nickname).trim().slice(0, 30);
    if (!n) throw badRequest('昵称不能为空');
    patch.nickname = n;
  }
  if (payload.avatarUrl !== undefined) patch.avatarUrl = String(payload.avatarUrl).slice(0, 500);
  return userDao.updateProfile(userId, patch);
}

function favorites(userId) {
  return favoriteDao.listByUser(userId);
}

async function toggleFavorite(userId, storyId) {
  if (!await storyDao.findById(storyId)) throw notFound('故事不存在或已下架');
  if (await favoriteDao.isFavorited(userId, storyId)) {
    await favoriteDao.remove(userId, storyId);
    return { favorited: false };
  }
  await favoriteDao.add(userId, storyId);
  return { favorited: true };
}

function history(userId) {
  return historyDao.listByUser(userId, 50);
}

async function saveProgress(userId, { storyId, episodeId, position }) {
  if (!await storyDao.findById(storyId)) throw notFound('故事不存在或已下架');
  const pos = Number(position);
  if (!Number.isFinite(pos) || pos < 0) throw badRequest('进度格式错误');
  await historyDao.upsertProgress(userId, storyId, episodeId || null, Math.floor(pos));
  return historyDao.getProgress(userId, storyId);
}

function getProgress(userId, storyId) {
  return historyDao.getProgress(userId, storyId);
}

async function clearHistory(userId) {
  await historyDao.clear(userId);
  return { cleared: true };
}

module.exports = {
  profile, updateProfile, favorites, toggleFavorite,
  history, saveProgress, getProgress, clearHistory,
};
