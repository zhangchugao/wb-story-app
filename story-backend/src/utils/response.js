'use strict';

// 统一响应格式，前端只需处理一套结构
function ok(res, data, message = 'ok') {
  return res.json({ code: 0, message, data });
}

function fail(res, code, message, httpStatus = 200) {
  return res.status(httpStatus).json({ code, message, data: null });
}

class ApiError extends Error {
  constructor(message, code = 400, httpStatus = 200) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

const badRequest = (msg = '参数错误') => new ApiError(msg, 400);
const unauthorized = (msg = '请先登录') => new ApiError(msg, 401);
const notFound = (msg = '资源不存在') => new ApiError(msg, 404);

module.exports = { ok, fail, ApiError, badRequest, unauthorized, notFound };
