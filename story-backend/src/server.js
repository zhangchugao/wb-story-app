'use strict';

require('./db/init'); // 启动时确保表结构与种子数据就绪
const app = require('./app');
const config = require('./config');

const server = app.listen(config.port, () => {
  console.log(`[story-backend] 服务已启动：http://localhost:${config.port}`);
  console.log(`[story-backend] 健康检查：http://localhost:${config.port}/api/health`);
  if (config.wechat.mockLogin) {
    console.log('[story-backend] 当前为开发模式 mock 登录（未配置微信 appid/secret）');
  }
});

// 优雅退出
['SIGTERM', 'SIGINT'].forEach((sig) => {
  process.on(sig, () => server.close(() => process.exit(0)));
});
