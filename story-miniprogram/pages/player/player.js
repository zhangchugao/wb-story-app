'use strict';

const api = require('../../utils/api');

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
  },

  onLoad(options) {
    this.storyId = options.id || 1;
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
      if (detail && detail.audio_url) {
        // 相对路径补全为后端绝对地址
        const url = detail.audio_url.indexOf('http') === 0
          ? detail.audio_url
          : 'http://localhost:3000' + detail.audio_url;
        ctx.src = url;
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
      ctx.onEnded(() => { this.setData({ playing: false }); });
      ctx.onError(() => { /* 音频源不可用时保持 UI 可交互 */ });
    } catch (e) { /* 预览环境无音频能力 */ }
  },

  reportProgress(pos) {
    if (!this.storyId) return;
    api.saveProgress(this.storyId, Math.floor(pos)).catch(() => {});
  },

  togglePlay() {
    const next = !this.data.playing;
    this.setData({ playing: next });
    if (this.audio) {
      if (next) this.audio.play(); else this.audio.pause();
    }
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
      }, mins * 60 * 1000);
    }
  },

  onUnload() {
    if (this.audio) { this.audio.stop(); this.audio.destroy(); }
    if (this._sleepTimer) clearTimeout(this._sleepTimer);
    if (this.storyId) this.reportProgress(this.data.current);
  },
});
