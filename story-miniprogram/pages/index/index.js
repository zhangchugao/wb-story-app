'use strict';

const api = require('../../utils/api');
const MOCK = require('../../utils/mock');

// 首页分类胶囊：晚安盒 / 磨耳朵 / 涨知识 / 老故事
const HOME_CATS = [
  { id: 1, name: '晚安盒', glyph: '☾' },
  { id: 2, name: '磨耳朵', glyph: '∿' },
  { id: 4, name: '涨知识', glyph: '✦' },
  { id: 3, name: '老故事', glyph: '❋' },
];

const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

function remainText(sec) {
  if (sec < 60) return sec + ' 秒';
  const m = Math.round(sec / 60);
  if (m < 60) return m + ' 分' + (sec % 60 >= 30 ? '多' : '') + ' 钟';
  return Math.floor(m / 60) + ' 小时 ' + (m % 60) + ' 分';
}

Page({
  data: {
    dateText: '',
    cats: HOME_CATS,
    hotStories: [],
    continueStory: null,
    loading: true,
  },

  onLoad() { this.loadData(); },

  onPullDownRefresh() {
    this.loadData(() => wx.stopPullDownRefresh && wx.stopPullDownRefresh());
  },

  async loadData(done) {
    this.setData({ loading: true });
    const now = new Date();
    const dateText = (now.getMonth() + 1) + ' 月 ' + now.getDate() + ' 日 · 周' + WEEK[now.getDay()];
    const [hot, history] = await Promise.all([
      api.getHot(),
      api.getHistory(),
    ]);
    const hotStories = (hot || []).slice(0, 6).map((s) => Object.assign({}, s, { cover: s.cover || MOCK.coverOf(s.id) }));
    // 「接着讲」：最近一条没听完的
    const last = (history || []).find((h) => !h.finished && h.position > 0) || (history || [])[0];
    let continueStory = null;
    if (last) {
      const remain = Math.max((last.durationRaw || last.duration || 300) - (last.position || 0), 0);
      continueStory = Object.assign({}, last, {
        cover: last.cover || MOCK.coverOf(last.id),
        percent: Math.min(Math.round(((last.position || 0) / (last.durationRaw || last.duration || 300)) * 100), 100),
        remainText: remainText(remain),
      });
    }
    this.setData({ dateText, hotStories, continueStory, loading: false });
    if (done) done();
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },

  goCategory(e) {
    const id = e.currentTarget.dataset.id;
    if (id) getApp().globalData.pendingCategory = id;
    wx.switchTab({
      url: '/pages/category/category',
      fail: () => wx.navigateTo({ url: '/pages/category/category?id=' + id }),
    });
  },

  goPlayer(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/player/player?id=' + id });
  },
});
