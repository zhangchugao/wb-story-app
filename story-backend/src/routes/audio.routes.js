'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const wrap = require('../utils/async-handler');
const { fail } = require('../utils/response');

const router = express.Router();

const MIME = { '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.ogg': 'audio/ogg', '.wav': 'audio/wav' };

// 音频流：支持 Range 请求，小程序 audio 组件拖动进度依赖 206 + Content-Range
router.get('/:filename', wrap(async (req, res) => {
  const filename = path.basename(req.params.filename); // 防目录穿越
  if (filename !== req.params.filename) return fail(res, 400, '非法文件名');

  const filePath = path.join(config.audio.dir, filename);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return fail(res, 404, '音频文件不存在');
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const ext = path.extname(filename).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';
  const range = req.headers.range;

  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    if (!match) {
      res.set('Content-Range', `bytes */${fileSize}`);
      return res.status(416).end();
    }
    let start = match[1] ? parseInt(match[1], 10) : 0;
    let end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
    if (start >= fileSize || end >= fileSize || start > end) {
      res.set('Content-Range', `bytes */${fileSize}`);
      return res.status(416).end();
    }
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
    });
    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=86400',
    });
    fs.createReadStream(filePath).pipe(res);
  }
}));

module.exports = router;
