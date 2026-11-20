'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const toBool = (v) => ['1', 'true', 'yes', 'on'].includes(String(v || '').toLowerCase());

const config = {
  port: Number(process.env.PORT || 3000),
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  },
  wechat: {
    appid: process.env.WX_APPID || '',
    secret: process.env.WX_SECRET || '',
    // 未配置 appid/secret 时启用开发模式 mock 登录，方便本地联调
    mockLogin: toBool(process.env.WX_MOCK_LOGIN) || !(process.env.WX_APPID && process.env.WX_SECRET),
  },
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    name: process.env.DB_NAME || 'story_app',
    connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
  },
  audio: {
    dir: path.resolve(__dirname, '../../', process.env.AUDIO_DIR || './storage/audio'),
  },
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },
};

module.exports = config;
