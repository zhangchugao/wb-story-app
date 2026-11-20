'use strict';

// 后端地址。真机调试时把 localhost 改成电脑局域网 IP，并确保手机同网段。
const BASE = 'http://localhost:3000/api';

// 内置兜底数据：后端未启动或预览环境下自动降级，页面不会白屏。
const MOCK = require('./mock');

function getToken() {
  try { return wx.getStorageSync('token') || ''; } catch (e) { return ''; }
}

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const header = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) header.Authorization = 'Bearer ' + token;
    wx.request({
      url: BASE + path,
      method: options.method || 'GET',
      data: options.data || {},
      header,
      timeout: 6000,
      success(res) {
        const body = res.data;
        if (res.statusCode >= 200 && res.statusCode < 300 && body && body.code === 0) {
          resolve(body.data);
        } else {
          reject(new Error((body && body.message) || '请求失败'));
        }
      },
      fail(err) { reject(err); },
    });
  });
}

// 每个方法：优先请求后端，失败回退 mock，保证 UI 永远有数据。
async function withFallback(remote, fallback) {
  try { return await remote(); } catch (e) { return fallback(); }
}

const api = {
  getCategories: () => withFallback(() => request('/stories/categories'), () => MOCK.categories),

  getHot: () => withFallback(() => request('/stories/hot'), () => MOCK.hotStories),

  getStories: (params) => withFallback(
    () => request('/stories', { data: params }),
    () => MOCK.filterStories(params)
  ),

  getHotKeywords: () => withFallback(() => request('/stories/search/hot'), () => MOCK.hotKeywords),

  getDetail: (id, user) => withFallback(
    () => request('/stories/' + id),
    () => MOCK.detail(id, user)
  ),

  login: (code, nickname, avatarUrl) => request('/auth/wx-login', {
    method: 'POST', data: { code, nickname, avatarUrl },
  }),

  getProfile: () => withFallback(() => request('/user/profile'), () => ({ nickname: '听故事的人', avatarUrl: '' })),
  getFavorites: () => withFallback(() => request('/user/favorites'), () => MOCK.favorites),
  getHistory: () => withFallback(() => request('/user/history'), () => MOCK.history),
  saveProgress: (storyId, position, episodeId) => withFallback(
    () => request('/user/progress', { method: 'POST', data: { storyId, position, episodeId } }),
    () => ({ story_id: storyId, position })
  ),
  toggleFavorite: (storyId) => withFallback(
    () => request('/user/favorites/' + storyId, { method: 'POST' }),
    () => ({ favorited: true })
  ),
};

module.exports = api;
