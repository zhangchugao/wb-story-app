'use strict';

const api = require('../../utils/api');

Page({
  data: {
    story: null,
    loading: true,
    favorited: false,
  },

  onLoad(options) {
    this.storyId = options.id || 1;
    this.loadDetail();
  },

  async loadDetail() {
    this.setData({ loading: true });
    const detail = await api.getDetail(this.storyId);
    this.setData({
      story: detail,
      favorited: detail ? !!detail.favorited : false,
      loading: false,
    });
  },

  toggleFavorite() {
    const next = !this.data.favorited;
    this.setData({ favorited: next });
    api.toggleFavorite(this.storyId).catch(() => {});
    wx.showToast({ title: next ? '已收藏' : '已取消收藏', icon: 'none' });
  },

  play(e) {
    const episode = e && e.currentTarget && e.currentTarget.dataset.ep;
    const url = '/pages/player/player?id=' + this.storyId + (episode ? '&ep=' + episode : '');
    wx.navigateTo({ url });
  },

  playEpisode(e) {
    this.play(e);
  },
});
