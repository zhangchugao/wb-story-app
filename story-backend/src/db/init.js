'use strict';

// 初始化种子数据：npm run init-db
// 仅在表为空时写入，重复执行不会重复插入
const db = require('./index');

function seed() {
  db.exec('BEGIN');
  try {
  const catCount = db.prepare('SELECT COUNT(*) AS n FROM categories').get().n;
  if (catCount === 0) {
    const insertCat = db.prepare('INSERT INTO categories (name, icon, sort_order) VALUES (?, ?, ?)');
    [
      ['童话寓言', 'fairy', 10],
      ['睡前故事', 'sleep', 20],
      ['历史传奇', 'history', 30],
      ['科普百科', 'science', 40],
      ['悬疑探案', 'mystery', 50],
    ].forEach((row) => insertCat.run(...row));
  }

  const storyCount = db.prepare('SELECT COUNT(*) AS n FROM stories').get().n;
  if (storyCount === 0) {
    const insertStory = db.prepare(`
      INSERT INTO stories
        (title, author, narrator, category_id, cover_url, description, audio_url, duration, play_count, sort_order)
      VALUES
        (@title, @author, @narrator, @category_id, @cover_url, @description, @audio_url, @duration, @play_count, @sort_order)
    `);
    const stories = [
      {
        title: '小红帽', author: '格林兄弟', narrator: '甜甜姐姐', category_id: 1,
        cover_url: '/static/cover-redhood.png', description: '经典童话，告诉孩子不要轻信陌生人。',
        audio_url: '/api/audio/little-red-riding-hood.mp3', duration: 312, play_count: 12840, sort_order: 100,
      },
      {
        title: '三只小猪', author: '佚名', narrator: '甜甜姐姐', category_id: 1,
        cover_url: '/static/cover-pigs.png', description: '勤劳和智慧，才能盖起最结实的房子。',
        audio_url: '/api/audio/three-little-pigs.mp3', duration: 428, play_count: 9632, sort_order: 90,
      },
      {
        title: '月亮的秘密', author: '原创', narrator: '阿哲哥哥', category_id: 2,
        cover_url: '/static/cover-moon.png', description: '温柔的睡前故事，陪孩子安稳入梦。',
        audio_url: '/api/audio/moon-secret.mp3', duration: 605, play_count: 7421, sort_order: 80,
      },
      {
        title: '少年将军霍去病', author: '历史组', narrator: '老韩', category_id: 3,
        cover_url: '/static/cover-huo.png', description: '匈奴未灭，何以家为。',
        audio_url: '/api/audio/huo-qubing.mp3', duration: 910, play_count: 5380, sort_order: 70,
      },
      {
        title: '十万个为什么·天空篇', author: '科普组', narrator: '小林老师', category_id: 4,
        cover_url: '/static/cover-sky.png', description: '天为什么是蓝色的？云为什么会下雨？',
        audio_url: '/api/audio/sky-why.mp3', duration: 756, play_count: 4120, sort_order: 60,
      },
      {
        title: ' vanished 的宝石', author: '悬疑组', narrator: '阿哲哥哥', category_id: 5,
        cover_url: '/static/cover-gem.png', description: '一场发生在古堡里的离奇失窃案。',
        audio_url: '/api/audio/vanished-gem.mp3', duration: 1180, play_count: 3315, sort_order: 50,
      },
    ];
    stories.forEach((s) => insertStory.run(s));

    const insertEp = db.prepare(`
      INSERT INTO episodes (story_id, title, episode_no, audio_url, duration)
      VALUES (?, ?, ?, ?, ?)
    `);
    // 给第 6 个故事做分集示例
    insertEp.run(6, '第一章 · 古堡来客', 1, '/api/audio/vanished-gem-01.mp3', 580);
    insertEp.run(6, '第二章 · 失踪的宝石', 2, '/api/audio/vanished-gem-02.mp3', 600);
  }

  const hotCount = db.prepare('SELECT COUNT(*) AS n FROM hot_keywords').get().n;
  if (hotCount === 0) {
    const insertHot = db.prepare('INSERT INTO hot_keywords (keyword, weight, sort_order) VALUES (?, ?, ?)');
    [['小红帽', 100, 1], ['睡前故事', 90, 2], ['三只小猪', 80, 3], ['科普', 70, 4], ['悬疑', 60, 5]]
      .forEach((row) => insertHot.run(...row));
  }

  const adminCount = db.prepare('SELECT COUNT(*) AS n FROM admins').get().n;
  if (adminCount === 0) {
    const crypto = require('crypto');
    const cfg = require('../config');
    const hash = crypto.createHash('sha256').update(cfg.admin.password).digest('hex');
    db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run(cfg.admin.username, hash);
  }
  db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

seed();
console.log('[init-db] 种子数据就绪');

// 允许直接 node src/db/init.js 独立执行
if (require.main === module) {
  console.log(`[init-db] 数据库：${require('../config').db.path}`);
}
