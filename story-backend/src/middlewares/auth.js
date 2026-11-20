'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config');
const { unauthorized } = require('../utils/response');
const userDao = require('../dao/user.dao');

function sign(user) {
  return jwt.sign({ sub: user.id, openid: user.openid }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

function required(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return next(unauthorized());
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    const user = userDao.findById(payload.sub);
    if (!user) return next(unauthorized('登录已失效，请重新登录'));
    req.user = user;
    next();
  } catch (e) {
    next(unauthorized('登录已失效，请重新登录'));
  }
}

// 可选登录：没带 token 也能过，带了就解析用户
function optional(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return next();
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    req.user = userDao.findById(payload.sub) || null;
  } catch (e) {
    req.user = null;
  }
  next();
}

module.exports = { sign, required, optional };
