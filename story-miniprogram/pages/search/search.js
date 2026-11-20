'use strict';

const api = require('../../utils/api');

Page({
  data: {
    keyword: '',
    hotKeywords: [],
    results: [],
    searched: false,
    loading: false,
  },

  onLoad() { this.loadHot(); },

  async loadHot() {
    const words = await api.getHotKeywords();
    this.setData({ hotKeywords: words || [] });
  },

  onInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  onConfirm() { this.doSearch(); },

  async doSearch() {
    const keyword = this.data.keyword.trim();
    if (!keyword) return;
    this.setData({ loading: true, searched: true });
    const res = await api.getStories({ keyword, page: 1, pageSize: 50 });
    this.setData({ results: (res && res.list) || [], loading: false });
  },

  tapHot(e) {
    const word = e.currentTarget.dataset.word;
    this.setData({ keyword: word });
    this.doSearch();
  },

  clear() {
    this.setData({ keyword: '', results: [], searched: false });
  },

  goDetail(e) {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id });
  },
});
