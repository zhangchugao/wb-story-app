'use strict';

const api = require('../../utils/api');

Page({
  data: {
    userInfo: null,
    avatarLetter: '?',
    favoritedCount: 0,
    historyCount: 0,
    menuGroups: [
      {
        key: 'library',
        items: [
          { key: 'favorites', text: '我的收藏', icon: '♥', path: '/pages/history/history?type=favorites' },
          { key: 'history', text: '播放历史', icon: '◷', path: '/pages/history/history?type=history' },
        ],
      },
      {
        key: 'settings',
        items: [
          { key: 'about', text: '关于听故事', icon: 'i', path: '' },
        ],
      },
    ],
  },

  onShow() {
    this.loadProfile();
    this.loadCounts();
  },

  async loadProfile() {
    let info = null;
    const token = (function () { try { return wx.getStorageSync('token'); } catch (e) { return ''; } })();
    if (token) {
      try {
        info = await api.getProfile();
      } catch (e) { info = null; }
    }
    if (!info) {
      // 预览/未登录兜底
      info = { nickname: '听故事的人', avatarUrl: '' };
    }
    const nickname = info.nickname || '';
    const letter = nickname ? Array.from(nickname)[0] : '?';
    this.setData({ userInfo: info, avatarLetter: letter });
  },

  async loadCounts() {
    const [fav, hist] = await Promise.all([api.getFavorites(), api.getHistory()]);
    this.setData({
      favoritedCount: (fav || []).length,
      historyCount: (hist || []).length,
    });
  },

  handleMenuTap(e) {
    const path = e.currentTarget.dataset.path;
    if (!path) {
      wx.showToast({ title: '听故事 · 让好声音陪伴每一天', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: path,
      fail: () => wx.showToast({ title: '页面暂未开放', icon: 'none' }),
    });
  },
});
