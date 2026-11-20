'use strict';

const storyDao = require('../dao/story.dao');
const favoriteDao = require('../dao/favorite.dao');
const historyDao = require('../dao/history.dao');
const { notFound } = require('../utils/response');

function getCategories() {
  return require('../dao/category.dao').all();
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

function getDetail(id, userId) {
  const story = storyDao.findById(id);
  if (!story) throw notFound('故事不存在或已下架');
  const episodes = storyDao.episodesOf(id);
  const favorited = userId ? favoriteDao.isFavorited(userId, id) : false;
  const progress = userId ? historyDao.getProgress(userId, id) : null;
  return { ...story, episodes, favorited, progress: progress || null };
}

function getHotKeywords() {
  return storyDao.hotKeywords(10);
}

function recordPlay(id) {
  if (!storyDao.findById(id)) throw notFound('故事不存在');
  storyDao.incrPlayCount(id);
}

module.exports = { getCategories, getStories, getHot, getDetail, getHotKeywords, recordPlay };
