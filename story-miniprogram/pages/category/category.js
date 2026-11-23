'use strict';

const api = require('../../utils/api');
const MOCK = require('../../utils/mock');

// 分类页插画（与设计稿 CATS 一致）
const CAT_IMG = {
  1: '/assets/covers/cover-yueliang.jpg',
  2: '/assets/covers/cover-tiankong.jpg',
  3: '/assets/covers/cover-xiaohongmao.jpg',
  4: '/assets/covers/cover-baoshi.jpg',
  5: '/assets/covers/cover-huoqubing.jpg',
};

Page({
  data: {
    cats: [],
    activeId: 1,
    activeName: '晚安盒',
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
    const list = (cats || []).map((c) => Object.assign({}, c, {
      img: CAT_IMG[c.id] || '/assets/covers/cover-yueliang.jpg',
      count: MOCK.filterStories({ categoryId: c.id }).total,
    }));
    const active = list.find((c) => c.id === this.data.activeId) || list[0];
    this.setData({ cats: list, activeName: active ? active.name : '晚安盒' });
    this.loadStories(this.data.activeId);
  },

  async loadStories(categoryId) {
    this.setData({ loading: true });
    const res = await api.getStories({ page: 1, pageSize: 50, categoryId });
    const list = ((res && res.list) || []).map((s) => Object.assign({}, s, { cover: s.cover || MOCK.coverOf(s.id) }));
    this.setData({ stories: list, loading: false });
  },

  switchCategory(e) {
    const id = e.currentTarget.dataset.id;
    if (id === this.data.activeId) return;
    const cat = this.data.cats.find((c) => c.id === id);
    this.setData({ activeId: id, activeName: cat ? cat.name : '' });
    this.loadStories(id);
  },

  goDetail(e) {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id });
  },

  goPlayer(e) {
    wx.navigateTo({ url: '/pages/player/player?id=' + e.currentTarget.dataset.id });
  },
});
