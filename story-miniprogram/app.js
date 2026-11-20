'use strict';

App({
  globalData: {
    appName: '听故事',
    // 当前播放中的故事（播放器页与首页迷你播放器共享）
    playingStory: null,
  },

  onLaunch() {
    // 静默登录：有 wx.login 能力时换取后端 token，失败不影响浏览
    try {
      if (typeof wx.login === 'function') {
        wx.login({
          success: (res) => {
            if (!res.code) return;
            const api = require('./utils/api');
            api.login(res.code).then((data) => {
              if (data && data.token) wx.setStorageSync('token', data.token);
            }).catch(() => {});
          },
        });
      }
    } catch (e) { /* 预览环境无 wx.login，忽略 */ }
  },
});
