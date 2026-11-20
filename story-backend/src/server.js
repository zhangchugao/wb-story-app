'use strict';

const db = require('./db');
const { seed } = require('./db/init');
const config = require('./config');

async function main() {
  // MySQL 初始化是异步的：先建库建表，再写种子数据，最后监听端口
  await db.init();
  await seed();

  const app = require('./app');
  const server = app.listen(config.port, () => {
    console.log(`[story-backend] 服务已启动：http://localhost:${config.port}`);
    console.log(`[story-backend] 健康检查：http://localhost:${config.port}/api/health`);
    console.log(`[story-backend] 数据库：MySQL ${config.db.host}:${config.db.port}/${config.db.name}`);
    if (config.wechat.mockLogin) {
      console.log('[story-backend] 当前为开发模式 mock 登录（未配置微信 appid/secret）');
    }
  });

  ['SIGTERM', 'SIGINT'].forEach((sig) => {
    process.on(sig, () => server.close(async () => {
      await db.close();
      process.exit(0);
    }));
  });
}

main().catch((e) => {
  console.error('[story-backend] 启动失败:', e.message);
  process.exit(1);
});
