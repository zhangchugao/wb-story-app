'use strict';

const api = require('../../utils/api');
const MOCK = require('../../utils/mock');

Page({
  data: {
    keyword: '',
    lastKeyword: '',
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
    this.setData({ loading: true, searched: true, lastKeyword: keyword });
    const res = await api.getStories({ keyword, page: 1, pageSize: 50 });
    const list = ((res && res.list) || []).map((s) => Object.assign({}, s, { cover: s.cover || MOCK.coverOf(s.id) }));
    this.setData({ results: list, loading: false });
  },

  tapHot(e) {
    const word = e.currentTarget.dataset.word;
    this.setData({ keyword: word });
    this.doSearch();
  },

  clear() {
    this.setData({ keyword: '', results: [], searched: false });
  },

  goFirst() {
    wx.navigateTo({ url: '/pages/detail/detail?id=3' });
  },

  goDetail(e) {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id });
  },

  goPlayer(e) {
    wx.navigateTo({ url: '/pages/player/player?id=' + e.currentTarget.dataset.id });
  },
});
