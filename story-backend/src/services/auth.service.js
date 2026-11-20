'use strict';

const crypto = require('crypto');
const axios = require('axios');
const config = require('../config');
const userDao = require('../dao/user.dao');
const { ApiError } = require('../utils/response');

async function code2session(code) {
  if (config.wechat.mockLogin) {
    // 开发模式：用 code 派生一个稳定的假 openid，方便无微信凭证时联调
    const openid = 'mock_' + crypto.createHash('md5').update(String(code)).digest('hex').slice(0, 24);
    return { openid, unionid: '' };
  }
  const { data } = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
    params: {
      appid: config.wechat.appid,
      secret: config.wechat.secret,
      js_code: code,
      grant_type: 'authorization_code',
    },
    timeout: 8000,
  });
  if (data.errcode) {
    throw new ApiError(`微信登录失败：${data.errmsg || data.errcode}`, 401);
  }
  return { openid: data.openid, unionid: data.unionid || '' };
}

async function login({ code, nickname, avatarUrl }) {
  if (!code) throw new ApiError('缺少 code', 400);
  const { openid, unionid } = await code2session(code);
  let user = userDao.findByOpenid(openid);
  if (!user) {
    user = userDao.create({ openid, unionId: unionid, nickname: nickname || '听友', avatarUrl: avatarUrl || '' });
  }
  return user;
}

module.exports = { login };
