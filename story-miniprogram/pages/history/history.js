'use strict';

const api = require('../../utils/api');

Page({
  data: {
    type: 'favorites',
    title: '我的收藏',
    list: [],
    loading: true,
  },

  onLoad(options) {
    const type = options.type === 'history' ? 'history' : 'favorites';
    this.setData({
      type,
      title: type === 'history' ? '播放历史' : '我的收藏',
    });
    wx.setNavigationBarTitle({ title: this.data.title });
    this.loadList();
  },

  async loadList() {
    this.setData({ loading: true });
    const data = this.data.type === 'history'
      ? await api.getHistory()
      : await api.getFavorites();
    this.setData({ list: data || [], loading: false });
  },

  goDetail(e) {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id });
  },

  goPlay(e) {
    wx.navigateTo({ url: '/pages/player/player?id=' + e.currentTarget.dataset.id });
  },
});
