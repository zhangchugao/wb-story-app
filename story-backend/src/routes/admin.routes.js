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
  const admin = adminService.login(username, password);
  ok(res, { token: adminAuth.sign(admin), userInfo: admin }, '登录成功');
}));

// 以下全部需要管理员鉴权
router.use(adminAuth.required);

router.get('/check', (req, res) => {
  ok(res, { valid: true, userInfo: req.admin });
});

router.get('/stats', (req, res) => {
  ok(res, adminService.stats());
});

// ---- 故事 ----
router.get('/stories', (req, res) => {
  ok(res, adminService.listStories(req.query));
});

router.post('/stories', wrap(async (req, res) => {
  ok(res, adminService.createStory(req.body || {}), '创建成功');
}));

router.put('/stories/:id', wrap(async (req, res) => {
  ok(res, adminService.updateStory(req.params.id, req.body || {}), '保存成功');
}));

router.delete('/stories/:id', wrap(async (req, res) => {
  ok(res, adminService.deleteStory(req.params.id), '已删除');
}));

router.post('/stories/:id/status', wrap(async (req, res) => {
  ok(res, adminService.setStoryStatus(req.params.id, (req.body || {}).status), '状态已更新');
}));

// ---- 分集 ----
router.get('/stories/:id/episodes', (req, res) => {
  ok(res, adminService.listEpisodes(req.params.id));
});

router.post('/stories/:id/episodes', wrap(async (req, res) => {
  ok(res, adminService.createEpisode(req.params.id, req.body || {}), '分集已添加');
}));

router.put('/episodes/:id', wrap(async (req, res) => {
  ok(res, adminService.updateEpisode(req.params.id, req.body || {}), '保存成功');
}));

router.delete('/episodes/:id', wrap(async (req, res) => {
  ok(res, adminService.deleteEpisode(req.params.id), '已删除');
}));

// ---- 分类 ----
router.get('/categories', (req, res) => {
  ok(res, adminService.allCategories());
});

router.post('/categories', wrap(async (req, res) => {
  ok(res, adminService.createCategory(req.body || {}), '创建成功');
}));

router.put('/categories/:id', wrap(async (req, res) => {
  ok(res, adminService.updateCategory(req.params.id, req.body || {}), '保存成功');
}));

router.delete('/categories/:id', wrap(async (req, res) => {
  ok(res, adminService.deleteCategory(req.params.id), '已删除');
}));

// ---- 热搜词 ----
router.get('/hot-keywords', (req, res) => {
  ok(res, adminService.allHotKeywords());
});

router.post('/hot-keywords', wrap(async (req, res) => {
  ok(res, adminService.createHotKeyword(req.body || {}), '添加成功');
}));

router.delete('/hot-keywords/:id', wrap(async (req, res) => {
  ok(res, adminService.deleteHotKeyword(req.params.id), '已删除');
}));

// ---- 用户 ----
router.get('/users', (req, res) => {
  ok(res, adminService.listUsers(req.query));
});

module.exports = router;
