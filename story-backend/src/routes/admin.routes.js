'use strict';

const express = require('express');
const router = express.Router();
const adminService = require('../services/admin.service');
const adminAuth = require('../middlewares/admin-auth');
const wrap = require('../utils/async-handler');
const { ok } = require('../utils/response');

// 登录不需要鉴权
router.post('/login', wrap(async (req, res) => {
  const { username, password } = req.body || {};
  const admin = await adminService.login(username, password);
  ok(res, { token: adminAuth.sign(admin), userInfo: admin }, '登录成功');
}));

// 以下全部需要管理员鉴权
router.use(adminAuth.required);

router.get('/check', wrap(async (req, res) => {
  ok(res, { valid: true, userInfo: req.admin });
}));

router.get('/stats', wrap(async (req, res) => {
  ok(res, await adminService.stats());
}));

// ---- 故事 ----
router.get('/stories', wrap(async (req, res) => {
  ok(res, await adminService.listStories(req.query));
}));

router.post('/stories', wrap(async (req, res) => {
  ok(res, await adminService.createStory(req.body || {}), '创建成功');
}));

router.put('/stories/:id', wrap(async (req, res) => {
  ok(res, await adminService.updateStory(req.params.id, req.body || {}), '保存成功');
}));

router.delete('/stories/:id', wrap(async (req, res) => {
  ok(res, await adminService.deleteStory(req.params.id), '已删除');
}));

router.post('/stories/:id/status', wrap(async (req, res) => {
  ok(res, await adminService.setStoryStatus(req.params.id, (req.body || {}).status), '状态已更新');
}));

// ---- 分集 ----
router.get('/stories/:id/episodes', wrap(async (req, res) => {
  ok(res, await adminService.listEpisodes(req.params.id));
}));

router.post('/stories/:id/episodes', wrap(async (req, res) => {
  ok(res, await adminService.createEpisode(req.params.id, req.body || {}), '分集已添加');
}));

router.put('/episodes/:id', wrap(async (req, res) => {
  ok(res, await adminService.updateEpisode(req.params.id, req.body || {}), '保存成功');
}));

router.delete('/episodes/:id', wrap(async (req, res) => {
  ok(res, await adminService.deleteEpisode(req.params.id), '已删除');
}));

// ---- 分类 ----
router.get('/categories', wrap(async (req, res) => {
  ok(res, await adminService.allCategories());
}));

router.post('/categories', wrap(async (req, res) => {
  ok(res, await adminService.createCategory(req.body || {}), '创建成功');
}));

router.put('/categories/:id', wrap(async (req, res) => {
  ok(res, await adminService.updateCategory(req.params.id, req.body || {}), '保存成功');
}));

router.delete('/categories/:id', wrap(async (req, res) => {
  ok(res, await adminService.deleteCategory(req.params.id), '已删除');
}));

// ---- 热搜词 ----
router.get('/hot-keywords', wrap(async (req, res) => {
  ok(res, await adminService.allHotKeywords());
}));

router.post('/hot-keywords', wrap(async (req, res) => {
  ok(res, await adminService.createHotKeyword(req.body || {}), '添加成功');
}));

router.delete('/hot-keywords/:id', wrap(async (req, res) => {
  ok(res, await adminService.deleteHotKeyword(req.params.id), '已删除');
}));

// ---- 用户 ----
router.get('/users', wrap(async (req, res) => {
  ok(res, await adminService.listUsers(req.query));
}));

module.exports = router;
