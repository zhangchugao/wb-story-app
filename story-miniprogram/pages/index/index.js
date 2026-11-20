'use strict';

const api = require('../../utils/api');

Page({
  data: {
    categories: [],
    hotStories: [],
    stories: [],
    loading: true,
    featured: null,
  },

  onLoad() { this.loadData(); },

  onPullDownRefresh() {
    this.loadData(() => wx.stopPullDownRefresh && wx.stopPullDownRefresh());
  },

  async loadData(done) {
    this.setData({ loading: true });
    const [categories, hot, list] = await Promise.all([
      api.getCategories(),
      api.getHot(),
      api.getStories({ page: 1, pageSize: 20, sort: 'hot' }),
    ]);
    const stories = (list && list.list) || [];
    this.setData({
      categories: (categories || []).slice(0, 5),
      hotStories: (hot || []).slice(0, 6),
      stories,
      featured: stories[0] || null,
      loading: false,
    });
    if (done) done();
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },

  goCategory(e) {
    const id = e.currentTarget.dataset.id;
    wx.switchTab({
      url: '/pages/category/category',
      fail: () => wx.navigateTo({ url: '/pages/category/category?id=' + id }),
    });
    if (id) getApp().globalData.pendingCategory = id;
  },

  goPlayer(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/player/player?id=' + id });
  },
});
