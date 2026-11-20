'use strict';

const storyDao = require('../dao/story.dao');
const categoryDao = require('../dao/category.dao');
const favoriteDao = require('../dao/favorite.dao');
const historyDao = require('../dao/history.dao');
const { notFound } = require('../utils/response');

function getCategories() {
  return categoryDao.all();
}

function getStories(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(query.pageSize, 10) || 20));
  const categoryId = query.categoryId ? parseInt(query.categoryId, 10) : undefined;
  return storyDao.list({
    categoryId: Number.isNaN(categoryId) ? undefined : categoryId,
    keyword: query.keyword ? String(query.keyword).trim().slice(0, 50) : undefined,
    page,
    pageSize,
    sort: query.sort,
  });
}

function getHot() {
  return storyDao.hot(10);
}

async function getDetail(id, userId) {
  const [story, episodes, favorited, progress] = await Promise.all([
    storyDao.findById(id),
    storyDao.episodesOf(id),
    userId ? favoriteDao.isFavorited(userId, id) : Promise.resolve(false),
    userId ? historyDao.getProgress(userId, id) : Promise.resolve(null),
  ]);
  if (!story) throw notFound('故事不存在或已下架');
  return { ...story, episodes, favorited, progress: progress || null };
}

function getHotKeywords() {
  return storyDao.hotKeywords(10);
}

async function recordPlay(id) {
  if (!await storyDao.findById(id)) throw notFound('故事不存在');
  await storyDao.incrPlayCount(id);
}

module.exports = { getCategories, getStories, getHot, getDetail, getHotKeywords, recordPlay };
