'use strict';

// 种子数据：仅在表为空时写入，幂等
// 由 server.js 在 db.init() 之后调用，也可 npm run init-db 独立执行
const db = require('./index');
const config = require('../config');

async function seed() {
  // 用事务保证原子性
  await db.transaction(async (tx) => {
    const catCount = (await tx.get('SELECT COUNT(*) AS n FROM categories')).n;
    if (catCount === 0) {
      const rows = [
        ['童话寓言', 'fairy', 10],
        ['睡前故事', 'sleep', 20],
        ['历史传奇', 'history', 30],
        ['科普百科', 'science', 40],
        ['悬疑探案', 'mystery', 50],
      ];
      for (const r of rows) {
        await tx.run('INSERT INTO categories (name, icon, sort_order) VALUES (?, ?, ?)', r);
      }
    }

    const storyCount = (await tx.get('SELECT COUNT(*) AS n FROM stories')).n;
    if (storyCount === 0) {
      const stories = [
        { title: '小红帽', author: '格林兄弟', narrator: '甜甜姐姐', category_id: 1, cover_url: '/static/cover-redhood.png', description: '经典童话，告诉孩子不要轻信陌生人。', audio_url: '/api/audio/little-red-riding-hood.mp3', duration: 312, play_count: 12840, sort_order: 100 },
        { title: '三只小猪', author: '佚名', narrator: '甜甜姐姐', category_id: 1, cover_url: '/static/cover-pigs.png', description: '勤劳和智慧，才能盖起最结实的房子。', audio_url: '/api/audio/three-little-pigs.mp3', duration: 428, play_count: 9632, sort_order: 90 },
        { title: '月亮的秘密', author: '原创', narrator: '阿哲哥哥', category_id: 2, cover_url: '/static/cover-moon.png', description: '温柔的睡前故事，陪孩子安稳入梦。', audio_url: '/api/audio/moon-secret.mp3', duration: 605, play_count: 7421, sort_order: 80 },
        { title: '少年将军霍去病', author: '历史组', narrator: '老韩', category_id: 3, cover_url: '/static/cover-huo.png', description: '匈奴未灭，何以家为。', audio_url: '/api/audio/huo-qubing.mp3', duration: 910, play_count: 5380, sort_order: 70 },
        { title: '十万个为什么·天空篇', author: '科普组', narrator: '小林老师', category_id: 4, cover_url: '/static/cover-sky.png', description: '天为什么是蓝色的？云为什么会下雨？', audio_url: '/api/audio/sky-why.mp3', duration: 756, play_count: 4120, sort_order: 60 },
        { title: '消失的宝石', author: '悬疑组', narrator: '阿哲哥哥', category_id: 5, cover_url: '/static/cover-gem.png', description: '一场发生在古堡里的离奇失窃案。', audio_url: '/api/audio/vanished-gem.mp3', duration: 1180, play_count: 3315, sort_order: 50 },
      ];
      const sql = `INSERT INTO stories
        (title, author, narrator, category_id, cover_url, description, audio_url, duration, play_count, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      for (const s of stories) {
        await tx.run(sql, [s.title, s.author, s.narrator, s.category_id, s.cover_url, s.description, s.audio_url, s.duration, s.play_count, s.sort_order]);
      }

      // 第 6 个故事的集数示例（假设 id 从 1 开始连续）
      const sixth = await tx.get('SELECT id FROM stories ORDER BY id DESC LIMIT 1');
      if (sixth) {
        await tx.run('INSERT INTO episodes (story_id, title, episode_no, audio_url, duration) VALUES (?, ?, ?, ?, ?)', [sixth.id, '第一章 · 古堡来客', 1, '/api/audio/vanished-gem-01.mp3', 580]);
        await tx.run('INSERT INTO episodes (story_id, title, episode_no, audio_url, duration) VALUES (?, ?, ?, ?, ?)', [sixth.id, '第二章 · 失踪的宝石', 2, '/api/audio/vanished-gem-02.mp3', 600]);
      }
    }

    const hotCount = (await tx.get('SELECT COUNT(*) AS n FROM hot_keywords')).n;
    if (hotCount === 0) {
      const rows = [['小红帽', 100, 1], ['睡前故事', 90, 2], ['三只小猪', 80, 3], ['科普', 70, 4], ['悬疑', 60, 5]];
      for (const r of rows) {
        await tx.run('INSERT INTO hot_keywords (keyword, weight, sort_order) VALUES (?, ?, ?)', r);
      }
    }

    const adminCount = (await tx.get('SELECT COUNT(*) AS n FROM admins')).n;
    if (adminCount === 0) {
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256').update(config.admin.password).digest('hex');
      await tx.run('INSERT INTO admins (username, password_hash) VALUES (?, ?)', [config.admin.username, hash]);
    }
  });
  console.log('[init-db] 种子数据就绪');
}

// 独立执行：npm run init-db
if (require.main === module) {
  (async () => {
    try {
      await db.init();
      await seed();
      console.log(`[init-db] 数据库：${config.db.host}:${config.db.port}/${config.db.name}`);
      await db.close();
    } catch (e) {
      console.error('[init-db] 失败:', e.message);
      process.exit(1);
    }
  })();
}

module.exports = { seed };
