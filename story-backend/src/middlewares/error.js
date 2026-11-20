'use strict';

const { ApiError, fail } = require('../utils/response');

function notFoundHandler(req, res) {
  return fail(res, 404, '接口不存在', 404);
}

function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return fail(res, err.code, err.message, err.httpStatus);
  }
  // better-sqlite3 唯一约束冲突
  if (err && err.code && String(err.code).startsWith('SQLITE_CONSTRAINT')) {
    return fail(res, 409, '数据已存在，请勿重复操作');
  }
  console.error('[error]', err && err.stack ? err.stack : err);
  return fail(res, 500, '服务器开小差了，请稍后再试', 500);
}

module.exports = { notFoundHandler, errorHandler };
