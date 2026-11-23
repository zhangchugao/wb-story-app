'use strict';

const api = require('../../utils/api');
const MOCK = require('../../utils/mock');

Page({
  data: {
    type: 'favorites',
    title: '我的收藏',
    list: [],
    groups: [],
    onlyUnfinished: false,
    loading: true,
  },

  onLoad(options) {
    const type = options.type === 'history' ? 'history' : 'favorites';
    this.setData({
      type,
      title: type === 'history' ? '听过的晚上' : '我的收藏',
    });
    wx.setNavigationBarTitle({ title: this.data.title });
    this.loadList();
  },

  async loadList() {
    this.setData({ loading: true });
    let data = this.data.type === 'history'
      ? await api.getHistory()
      : await api.getFavorites();
    data = (data || []).map((s) => Object.assign({}, s, { cover: s.cover || MOCK.coverOf(s.id) }));
    this.setData({ list: data, loading: false });
    this.buildGroups();
  },

  // 按日期分组（今晚/昨晚…），讲完的置灰且没有播放钮
  buildGroups() {
    if (this.data.type !== 'history') return;
    const source = this.data.onlyUnfinished
      ? this.data.list.filter((x) => !x.finished)
      : this.data.list;
    const order = ['今晚', '昨晚', '更早'];
    const map = {};
    source.forEach((item) => {
      const day = item.day || '更早';
      const dur = item.durationRaw || item.duration || 300;
      if (!map[day]) map[day] = [];
      map[day].push(Object.assign({}, item, {
        finished: item.finished || (item.position || 0) >= dur,
        percent: Math.min(Math.round(((item.position || 0) / dur) * 100), 100),
        remainText: MOCK.formatTime(Math.max(dur - (item.position || 0), 0)),
      }));
    });
    const groups = Object.keys(map)
      .sort((a, b) => order.indexOf(a) - order.indexOf(b))
      .map((day) => ({ day, items: map[day] }));
    this.setData({ groups });
  },

  toggleOnlyUnfinished() {
    this.setData({ onlyUnfinished: !this.data.onlyUnfinished });
    this.buildGroups();
  },

  goDetail(e) {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id });
  },

  goPlay(e) {
    wx.navigateTo({ url: '/pages/player/player?id=' + e.currentTarget.dataset.id });
  },
});
