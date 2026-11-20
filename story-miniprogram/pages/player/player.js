'use strict';

const api = require('../../utils/api');

// 音频绝对地址：与 api.js 共用同一后端 HOST（真机调试时随 api.js 一起切换局域网 IP）
function absUrl(pathOrUrl) {
  return pathOrUrl.indexOf('http') === 0 ? pathOrUrl : api.HOST + pathOrUrl;
}

Page({
  data: {
    story: null,
    playing: false,
    current: 0,
    duration: 0,
    currentText: '0:00',
    durationText: '0:00',
    speedIndex: 1,
    speeds: [0.75, 1, 1.25, 1.5, 2],
    sleepText: '定时关闭',
    sleepOptions: ['关闭', '10 分钟', '20 分钟', '30 分钟', '45 分钟'],
    sleepIndex: 0,
    bgmOn: false,
    bgmTracks: [
      { key: 'starlight', name: '星光摇篮曲', url: '/api/audio/bgm-starlight.mp3' },
      { key: 'rain', name: '细雨呢喃', url: '/api/audio/bgm-rain.mp3' },
      { key: 'garden', name: '梦境花园', url: '/api/audio/bgm-garden.mp3' },
    ],
    bgmIndex: 0,
    bgmName: '星光摇篮曲',
  },

  onLoad(options) {
    this.storyId = options.id || 1;
    // 恢复用户 BGM 偏好
    this.setData({
      bgmOn: wx.getStorageSync('bgmEnabled') === true,
      bgmIndex: wx.getStorageSync('bgmTrack') || 0,
    });
    this.setData({ bgmName: this.data.bgmTracks[this.data.bgmIndex].name });
    this.loadStory();
  },

  async loadStory() {
    const detail = await api.getDetail(this.storyId);
    const duration = (detail && detail.duration) || 300;
    this.setData({
      story: detail,
      duration,
      durationText: api.formatTime ? api.formatTime(duration) : this.fmt(duration),
    });
    this.initAudio(detail);
  },

  fmt(sec) {
    sec = Math.floor(sec || 0);
    const m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + (s < 10 ? '0' + s : s);
  },

  initAudio(detail) {
    try {
      if (!wx.createInnerAudioContext) return;
      const ctx = wx.createInnerAudioContext();
      this.audio = ctx;
      // 音频源：故事主音频 → 兜底取第一个有音频的分集
      let src = (detail && detail.audio_url) || '';
      if (!src && detail && Array.isArray(detail.episodes)) {
        const ep = detail.episodes.find((e) => e.audio_url);
        if (ep) src = ep.audio_url;
      }
      if (src) {
        ctx.src = absUrl(src);
        this._hasAudio = true;
      } else {
        // 该故事没有任何音频（如未导入完成的英文故事）
        this._hasAudio = false;
        wx.showToast({ title: '这个故事暂时没有音频哦', icon: 'none' });
      }
      ctx.onTimeUpdate(() => {
        if (!ctx.duration || !isFinite(ctx.duration)) return;
        this.setData({
          current: ctx.currentTime,
          duration: ctx.duration,
          currentText: this.fmt(ctx.currentTime),
          durationText: this.fmt(ctx.duration),
        });
        // 每 10 秒上报一次进度
        if (Math.floor(ctx.currentTime) % 10 === 0 && Math.floor(ctx.currentTime) !== this._lastReport) {
          this._lastReport = Math.floor(ctx.currentTime);
          this.reportProgress(ctx.currentTime);
        }
      });
      ctx.onEnded(() => {
        this.setData({ playing: false });
        this.syncBgm();
      });
      ctx.onError(() => {
        this.setData({ playing: false });
        this.syncBgm();
        wx.showToast({ title: '音频加载失败，请稍后重试', icon: 'none' });
      });
    } catch (e) { /* 预览环境无音频能力 */ }
  },

  // ---------- 背景音乐 ----------

  initBgm() {
    if (this.bgm || !wx.createInnerAudioContext) return;
    const ctx = wx.createInnerAudioContext();
    ctx.loop = true;
    ctx.volume = 0.18; // BGM 音量压低，突出故事人声
    ctx.onError(() => { /* BGM 拉取失败不影响故事播放 */ });
    this.bgm = ctx;
    this._bgmLoadedKey = '';
  },

  syncBgm() {
    const shouldPlay = this.data.playing && this.data.bgmOn;
    if (!shouldPlay) {
      if (this.bgm) this.bgm.pause();
      return;
    }
    this.initBgm();
    const track = this.data.bgmTracks[this.data.bgmIndex];
    if (!track) return;
    if (this._bgmLoadedKey !== track.key) {
      this.bgm.src = absUrl(track.url);
      this._bgmLoadedKey = track.key;
    }
    this.bgm.play();
  },

  toggleBgm() {
    const next = !this.data.bgmOn;
    this.setData({ bgmOn: next });
    wx.setStorageSync('bgmEnabled', next);
    this.syncBgm();
    wx.showToast({ title: next ? '背景音乐已开启' : '背景音乐已关闭', icon: 'none' });
  },

  cycleBgmTrack() {
    const next = (this.data.bgmIndex + 1) % this.data.bgmTracks.length;
    this.setData({ bgmIndex: next, bgmName: this.data.bgmTracks[next].name });
    wx.setStorageSync('bgmTrack', next);
    this._bgmLoadedKey = '';
    this.syncBgm();
  },

  reportProgress(pos) {
    if (!this.storyId) return;
    api.saveProgress(this.storyId, Math.floor(pos)).catch(() => {});
  },

  togglePlay() {
    if (this._hasAudio === false) {
      wx.showToast({ title: '这个故事暂时没有音频哦', icon: 'none' });
      return;
    }
    const next = !this.data.playing;
    this.setData({ playing: next });
    if (this.audio) {
      if (next) this.audio.play(); else this.audio.pause();
    }
    this.syncBgm();
  },

  seek(e) {
    const pct = e.detail.value / 100;
    const target = pct * this.data.duration;
    this.setData({ current: target, currentText: this.fmt(target) });
    if (this.audio && this.audio.seek) this.audio.seek(target);
  },

  skip(e) {
    const dir = Number(e.currentTarget.dataset.dir);
    let target = this.data.current + dir * 15;
    target = Math.max(0, Math.min(target, this.data.duration));
    this.setData({ current: target, currentText: this.fmt(target) });
    if (this.audio && this.audio.seek) this.audio.seek(target);
  },

  cycleSpeed() {
    const next = (this.data.speedIndex + 1) % this.data.speeds.length;
    this.setData({ speedIndex: next });
    if (this.audio && this.audio.playbackRate) this.audio.playbackRate = this.data.speeds[next];
    wx.showToast({ title: this.data.speeds[next] + 'x', icon: 'none' });
  },

  cycleSleep() {
    const next = (this.data.sleepIndex + 1) % this.data.sleepOptions.length;
    this.setData({ sleepIndex: next, sleepText: this.data.sleepOptions[next] });
    if (this._sleepTimer) { clearTimeout(this._sleepTimer); this._sleepTimer = null; }
    const mins = [0, 10, 20, 30, 45][next];
    if (mins > 0) {
      this._sleepTimer = setTimeout(() => {
        this.setData({ playing: false });
        if (this.audio) this.audio.pause();
        if (this.bgm) this.bgm.pause();
      }, mins * 60 * 1000);
    }
  },

  onUnload() {
    if (this.audio) { this.audio.stop(); this.audio.destroy(); }
    if (this.bgm) { this.bgm.stop(); this.bgm.destroy(); }
    if (this._sleepTimer) clearTimeout(this._sleepTimer);
    if (this.storyId) this.reportProgress(this.data.current);
  },
});
