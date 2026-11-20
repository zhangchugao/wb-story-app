'use strict';

const crypto = require('crypto');
const adminDao = require('../dao/admin.dao');
const { ApiError, notFound, badRequest } = require('../utils/response');

function login(username, password) {
  if (!username || !password) throw badRequest('请输入账号和密码');
  const admin = adminDao.findAdmin(String(username).trim());
  const hash = crypto.createHash('sha256').update(String(password)).digest('hex');
  if (!admin || admin.password_hash !== hash) {
    throw new ApiError('账号或密码错误', 401);
  }
  return { id: admin.id, username: admin.username };
}

function listStories(q) {
  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(q.pageSize, 10) || 10));
  return adminDao.listStories({
    page, pageSize,
    keyword: q.keyword ? String(q.keyword).trim().slice(0, 50) : undefined,
    categoryId: q.categoryId,
    status: q.status,
  });
}

function createStory(body) {
  if (!body.title || !String(body.title).trim()) throw badRequest('标题不能为空');
  return adminDao.createStory({
    title: String(body.title).trim(),
    author: body.author || '',
    narrator: body.narrator || '',
    category_id: body.category_id || null,
    cover_url: body.cover_url || '',
    description: body.description || '',
    audio_url: body.audio_url || '',
    duration: Number(body.duration) || 0,
    status: body.status === undefined ? 1 : Number(body.status),
    sort_order: Number(body.sort_order) || 0,
  });
}

function updateStory(id, body) {
  if (!adminDao.findStory(id)) throw notFound('故事不存在');
  return adminDao.updateStory(id, body);
}

function deleteStory(id) {
  if (!adminDao.findStory(id)) throw notFound('故事不存在');
  adminDao.deleteStory(id);
  return { deleted: true };
}

function setStoryStatus(id, status) {
  if (!adminDao.findStory(id)) throw notFound('故事不存在');
  return adminDao.setStoryStatus(id, Number(status) === 1 ? 1 : 0);
}

function listEpisodes(storyId) {
  if (!adminDao.findStory(storyId)) throw notFound('故事不存在');
  return adminDao.episodesOf(storyId);
}

function createEpisode(storyId, body) {
  if (!adminDao.findStory(storyId)) throw notFound('故事不存在');
  if (!body.title || !String(body.title).trim()) throw badRequest('分集标题不能为空');
  return adminDao.createEpisode(storyId, {
    title: String(body.title).trim(),
    episode_no: Number(body.episode_no) || 1,
    audio_url: body.audio_url || '',
    duration: Number(body.duration) || 0,
  });
}

function updateEpisode(id, body) {
  return adminDao.updateEpisode(id, body);
}

function deleteEpisode(id) {
  adminDao.deleteEpisode(id);
  return { deleted: true };
}

function createCategory(body) {
  if (!body.name || !String(body.name).trim()) throw badRequest('分类名不能为空');
  return adminDao.createCategory({
    name: String(body.name).trim(),
    icon: body.icon || '',
    sort_order: Number(body.sort_order) || 0,
  });
}

function updateCategory(id, body) {
  return adminDao.updateCategory(id, body);
}

function deleteCategory(id) {
  if (!adminDao.deleteCategory(id)) {
    throw new ApiError('该分类下还有故事，不能删除', 409);
  }
  return { deleted: true };
}

function createHotKeyword(body) {
  if (!body.keyword || !String(body.keyword).trim()) throw badRequest('关键词不能为空');
  return adminDao.createHotKeyword({
    keyword: String(body.keyword).trim(),
    weight: Number(body.weight) || 0,
    sort_order: Number(body.sort_order) || 0,
  });
}

function listUsers(q) {
  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(q.pageSize, 10) || 10));
  return adminDao.listUsers({
    page, pageSize,
    keyword: q.keyword ? String(q.keyword).trim().slice(0, 50) : undefined,
  });
}

module.exports = {
  login, stats: adminDao.stats,
  listStories, createStory, updateStory, deleteStory, setStoryStatus,
  listEpisodes, createEpisode, updateEpisode, deleteEpisode,
  allCategories: adminDao.allCategories, createCategory, updateCategory, deleteCategory,
  allHotKeywords: adminDao.allHotKeywords, createHotKeyword, deleteHotKeyword: adminDao.deleteHotKeyword,
  listUsers,
};
