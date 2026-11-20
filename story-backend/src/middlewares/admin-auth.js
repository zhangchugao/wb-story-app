'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config');
const { unauthorized } = require('../utils/response');
const adminDao = require('../dao/admin.dao');

function sign(admin) {
  return jwt.sign({ sub: admin.id, username: admin.username, role: 'admin' }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

function required(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return next(unauthorized('请先登录管理后台'));
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    if (payload.role !== 'admin') return next(unauthorized('无权访问管理后台'));
    const admin = adminDao.findAdminById(payload.sub);
    if (!admin) return next(unauthorized('登录已失效'));
    req.admin = admin;
    next();
  } catch (e) {
    next(unauthorized('登录已失效，请重新登录'));
  }
}

module.exports = { sign, required };
