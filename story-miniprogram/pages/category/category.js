'use strict';

const api = require('../../utils/api');

Page({
  data: {
    categories: [],
    activeId: 0,
    stories: [],
    loading: true,
  },

  onLoad() {
    const pending = getApp().globalData.pendingCategory;
    this.setData({ activeId: pending || 1 });
    if (pending) getApp().globalData.pendingCategory = null;
    this.loadCategories();
  },

  async loadCategories() {
    const cats = await api.getCategories();
    this.setData({ categories: cats || [] });
    this.loadStories(this.data.activeId);
  },

  async loadStories(categoryId) {
    this.setData({ loading: true });
    const res = await api.getStories({ page: 1, pageSize: 50, categoryId });
    this.setData({ stories: (res && res.list) || [], loading: false });
  },

  switchCategory(e) {
    const id = e.currentTarget.dataset.id;
    if (id === this.data.activeId) return;
    this.setData({ activeId: id });
    this.loadStories(id);
  },

  goDetail(e) {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id });
  },
});
