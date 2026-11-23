'use strict';

const api = require('../../utils/api');

Page({
  data: {
    userInfo: null,
    avatarLetter: '听',
    favoritedCount: 0,
    historyCount: 0,
    listenNights: 0,
    menuItems: [
      { key: 'favorites', text: '收藏的故事', icon: '♡', path: '/pages/history/history?type=favorites' },
      { key: 'history', text: '听过的晚上', icon: '☾', path: '/pages/history/history?type=history' },
      { key: 'about', text: '关于听故事', icon: '✦', path: '' },
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
      info = { nickname: '听故事的人', avatarUrl: '' };
    }
    const nickname = info.nickname || '';
    const letter = nickname ? Array.from(nickname)[0] : '听';
    this.setData({ userInfo: info, avatarLetter: letter });
  },

  async loadCounts() {
    const [fav, hist] = await Promise.all([api.getFavorites(), api.getHistory()]);
    const favCount = (fav || []).length;
    const histCount = (hist || []).length;
    this.setData({
      favoritedCount: favCount,
      historyCount: histCount,
      listenNights: histCount + 19, // mock：按现有数据给出体感的陪听夜数
    });
  },

  handleMenuTap(e) {
    const path = e.currentTarget.dataset.path;
    if (!path) {
      wx.showToast({ title: '听故事 · 今夜的灯', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: path,
      fail: () => wx.showToast({ title: '页面稍后开放', icon: 'none' }),
    });
  },
});
