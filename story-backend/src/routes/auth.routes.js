'use strict';

const express = require('express');
const router = express.Router();
const authService = require('../services/auth.service');
const auth = require('../middlewares/auth');
const wrap = require('../utils/async-handler');
const { ok, ApiError } = require('../utils/response');

// 微信登录：前端 wx.login() 拿 code 换 token
router.post('/wx-login', wrap(async (req, res) => {
  const { code, nickname, avatarUrl } = req.body || {};
  const user = await authService.login({ code, nickname, avatarUrl });
  const token = auth.sign(user);
  ok(res, { token, userInfo: user }, '登录成功');
}));

// 校验 token 是否有效（前端启动时用）
router.get('/check', auth.required, (req, res) => {
  ok(res, { valid: true, userInfo: req.user });
});

module.exports = router;
