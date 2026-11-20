'use strict';

const express = require('express');
const router = express.Router();
const userService = require('../services/user.service');
const favoriteDao = require('../dao/favorite.dao');
const auth = require('../middlewares/auth');
const wrap = require('../utils/async-handler');
const { ok } = require('../utils/response');

// 本路由下所有接口都需要登录
router.use(auth.required);

router.get('/profile', (req, res) => {
  ok(res, userService.profile(req.user.id));
});

router.put('/profile', wrap(async (req, res) => {
  ok(res, userService.updateProfile(req.user.id, req.body || {}), '已保存');
}));

router.get('/favorites', (req, res) => {
  ok(res, userService.favorites(req.user.id));
});

router.post('/favorites/:storyId', wrap(async (req, res) => {
  const result = userService.toggleFavorite(req.user.id, req.params.storyId);
  ok(res, result);
}));

router.delete('/favorites/:storyId', wrap(async (req, res) => {
  favoriteDao.remove(req.user.id, req.params.storyId);
  ok(res, { favorited: false });
}));

router.get('/history', (req, res) => {
  ok(res, userService.history(req.user.id));
});

router.delete('/history', (req, res) => {
  ok(res, userService.clearHistory(req.user.id));
});

router.get('/progress/:storyId', (req, res) => {
  ok(res, userService.getProgress(req.user.id, req.params.storyId));
});

// 上报播放进度（断点续听）
router.post('/progress', wrap(async (req, res) => {
  const { storyId, episodeId, position } = req.body || {};
  ok(res, userService.saveProgress(req.user.id, { storyId, episodeId, position }));
}));

module.exports = router;
