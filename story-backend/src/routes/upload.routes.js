'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const config = require('../config');
const adminAuth = require('../middlewares/admin-auth');
const wrap = require('../utils/async-handler');
const { ok, ApiError } = require('../utils/response');

const staticDir = path.resolve(__dirname, '../../storage/static');
fs.mkdirSync(config.audio.dir, { recursive: true });
fs.mkdirSync(staticDir, { recursive: true });

const AUDIO_EXT = new Set(['.mp3', '.m4a', '.aac', '.ogg', '.wav']);
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp']);

function makeStorage(dir, extSet) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (!extSet.has(ext)) return cb(new ApiError('不支持的文件类型', 400));
      const name = crypto.randomBytes(8).toString('hex') + ext;
      cb(null, name);
    },
  });
}

const audioUpload = multer({
  storage: makeStorage(config.audio.dir, AUDIO_EXT),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

const imageUpload = multer({
  storage: makeStorage(staticDir, IMAGE_EXT),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

router.use(adminAuth.required);

router.post('/audio', audioUpload.single('file'), wrap(async (req, res) => {
  if (!req.file) throw new ApiError('请选择文件', 400);
  ok(res, { url: '/api/audio/' + req.file.filename, filename: req.file.filename }, '上传成功');
}));

router.post('/image', imageUpload.single('file'), wrap(async (req, res) => {
  if (!req.file) throw new ApiError('请选择文件', 400);
  ok(res, { url: '/static/' + req.file.filename, filename: req.file.filename }, '上传成功');
}));

// multer 错误处理
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ code: 413, message: '文件太大', data: null });
    return res.status(400).json({ code: 400, message: '上传失败：' + err.message, data: null });
  }
  next(err);
});

module.exports = router;
