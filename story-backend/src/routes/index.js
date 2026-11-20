'use strict';

const express = require('express');
const router = express.Router();
const { ok } = require('../utils/response');

router.get('/health', (req, res) => {
  ok(res, { status: 'up', time: new Date().toISOString() }, '服务正常');
});

router.use('/auth', require('./auth.routes'));
router.use('/stories', require('./story.routes'));
router.use('/user', require('./user.routes'));
router.use('/audio', require('./audio.routes'));

// 管理后台（upload 放前面，避免被 admin 路由重复鉴权）
router.use('/admin/upload', require('./upload.routes'));
router.use('/admin', require('./admin.routes'));

module.exports = router;
