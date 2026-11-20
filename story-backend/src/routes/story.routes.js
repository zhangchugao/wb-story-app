'use strict';

const express = require('express');
const router = express.Router();
const storyService = require('../services/story.service');
const auth = require('../middlewares/auth');
const wrap = require('../utils/async-handler');
const { ok, fail } = require('../utils/response');

router.get('/categories', (req, res) => {
  ok(res, storyService.getCategories());
});

router.get('/hot', (req, res) => {
  ok(res, storyService.getHot());
});

router.get('/search/hot', (req, res) => {
  ok(res, storyService.getHotKeywords());
});

router.get('/', wrap(async (req, res) => {
  ok(res, storyService.getStories(req.query));
}));

// 可选登录：带了 token 就带上收藏状态与播放进度
router.get('/:id', auth.optional, wrap(async (req, res) => {
  const userId = req.user ? req.user.id : null;
  ok(res, storyService.getDetail(req.params.id, userId));
}));

router.post('/:id/play', wrap(async (req, res) => {
  storyService.recordPlay(req.params.id);
  ok(res, { ok: true });
}));

module.exports = router;
