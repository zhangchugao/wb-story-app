'use strict';

/**
 * LibriVox 音频批量导入脚本
 *
 * 从 LibriVox（公有领域有声书）拉取童话/寓言类作品，解析分集，
 * 下载音频到 storage/audio，生成封面，并写入 MySQL。
 *
 * 用法：
 *   node tools/import-librivox.js --dry-run                 # 只预览不入库
 *   node tools/import-librivox.js --limit 3 --episodes 5     # 导入3个作品，每个前5集
 *   node tools/import-librivox.js --skip-download            # 不下载音频，仅存远程URL
 *   node tools/import-librivox.js --keywords Aesop,Grimm     # 自定义搜索词
 *
 * 说明：音频托管在 archive.org，某些网络环境不可达；下载失败时仍会入库，
 *       并保留远程 audio_url，可用 node tools/import-librivox.js --retry-download 补下。
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const axios = require('axios');
const db = require('../src/db');
const config = require('../src/config');
const { seed } = require('../src/db/init');

// ---------- 参数解析 ----------
const argv = process.argv.slice(2);
function arg(name, def) {
  const i = argv.indexOf('--' + name);
  return i >= 0 ? (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true) : def;
}
const OPT = {
  dryRun: argv.includes('--dry-run'),
  skipDownload: argv.includes('--skip-download'),
  retryDownload: argv.includes('--retry-download'),
  limit: Number(arg('limit', 6)) || 6,
  episodes: Number(arg('episodes', 6)) || 6,
  keywords: String(arg('keywords', 'Aesop,Grimm,Andersen,Perrault,fairy tale'))
    .split(',').map((s) => s.trim()).filter(Boolean),
  downloadTimeout: Number(arg('timeout', 45000)) || 45000,
};

const STATIC_DIR = path.resolve(__dirname, '../storage/static');
fs.mkdirSync(config.audio.dir, { recursive: true });
fs.mkdirSync(STATIC_DIR, { recursive: true });

// HTTP(S) 客户端：走环境变量代理（axios 自动读 HTTP_PROXY/HTTPS_PROXY）
const client = axios.create({ timeout: 30000, headers: { 'User-Agent': 'StoryAudioImporter/1.0' } });

const PALETTE = [
  ['#FFAB91', '#FF7043'], ['#80DEB1', '#10B981'], ['#92B4F4', '#3B82F6'],
  ['#FFD166', '#F59E0B'], ['#B39DDB', '#8B5CF6'], ['#6FCFBF', '#0891B2'],
];

// ---------- 搜索作品 ----------
async function searchBooks() {
  const seen = new Set();
  const books = [];
  for (const kw of OPT.keywords) {
    try {
      const url = 'https://librivox.org/api/feed/audiobooks/?format=json&limit=20&' +
        (kw.includes(' ') ? 'description=' : 'author=') + encodeURIComponent(kw);
      const { data } = await client.get(url);
      for (const b of (data.books || [])) {
        if (seen.has(b.id)) continue;
        seen.add(b.id);
        books.push(b);
      }
      console.log(`  搜索「${kw}」→ ${(data.books || []).length} 个结果`);
    } catch (e) {
      console.log(`  搜索「${kw}」失败: ${e.message}`);
    }
  }
  // 过滤：只要短篇/中等篇幅（总时长 < 6 小时），避免超长有声书
  return books
    .filter((b) => Number(b.totaltimesecs || 0) > 0 && Number(b.totaltimesecs) < 6 * 3600)
    .sort((a, b) => Number(a.totaltimesecs) - Number(b.totaltimesecs))
    .slice(0, OPT.limit);
}

// ---------- 解析 RSS 分集 ----------
function parseDuration(str) {
  const parts = String(str || '').trim().split(':').map((x) => parseInt(x, 10) || 0);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

async function fetchEpisodes(book) {
  const rssUrl = book.url_rss || ('https://librivox.org/rss/' + book.id);
  const { data } = await client.get(rssUrl, { responseType: 'text' });
  const items = [...data.matchAll(/<item>([\s\S]*?)<\/item>/g)];
  const episodes = [];
  for (const m of items) {
    const block = m[1];
    const title = ((block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || [])[1] ||
      (block.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '').trim();
    const url = (block.match(/<enclosure[^>]*url="([^"]+)"/) || [])[1];
    const durRaw = ((block.match(/<itunes:duration>([\s\S]*?)<\/itunes:duration>/) || [])[1] || '')
      .replace(/<!\[CDATA\[|\]\]>/g, '').trim();
    if (url) episodes.push({ title: title || '未命名', url, duration: parseDuration(durRaw) });
  }
  return episodes.slice(0, OPT.episodes);
}

// ---------- 下载音频 ----------
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https:') ? https : http;
    const req = mod.get(url, { timeout: OPT.downloadTimeout, headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      // 处理重定向
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return downloadFile(res.headers.location, dest).then(resolve, reject);
      }
      if (res.statusCode !== 200 && res.statusCode !== 206) {
        res.resume();
        return reject(new Error('HTTP ' + res.statusCode));
      }
      const tmp = dest + '.part';
      const file = fs.createWriteStream(tmp);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        fs.renameSync(tmp, dest);
        resolve(fs.statSync(dest).size);
      });
      file.on('error', (e) => { try { fs.unlinkSync(tmp); } catch (_) {} reject(e); });
    });
    req.on('timeout', () => { req.destroy(new Error('下载超时')); });
    req.on('error', reject);
  });
}

// ---------- 生成 SVG 封面 ----------
function makeCover(title, index) {
  const [from, to] = PALETTE[index % PALETTE.length];
  const safe = String(title).replace(/&/g, '&amp;').replace(/</g, '&lt;').slice(0, 18);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
<rect width="400" height="400" fill="url(#g)"/>
<circle cx="320" cy="80" r="120" fill="rgba(255,255,255,0.12)"/>
<text x="200" y="215" font-size="36" fill="#fff" font-family="sans-serif" font-weight="bold" text-anchor="middle">${safe}</text>
<text x="200" y="270" font-size="18" fill="rgba(255,255,255,0.85)" font-family="sans-serif" text-anchor="middle">LibriVox · 公有领域</text>
</svg>`;
  const name = 'librivox-' + index + '-' + Date.now() + '.svg';
  fs.writeFileSync(path.join(STATIC_DIR, name), svg);
  return '/static/' + name;
}

// ---------- 标题中文化 ----------
// 经典作品映射到中文名，让小程序展示更友好；未命中则保留原名
function chineseTitle(title) {
  const t = String(title);
  const rules = [
    [/aesop.?s fables[,\s]*volume\s*(\d+).*fables\s*(\d+)-(\d+)/i, (m) => `伊索寓言·第${m[1]}卷（${m[2]}-${m[3]}）`],
    [/aesop.?s fables.*volume\s*(\d+)/i, (m) => `伊索寓言·第${m[1]}卷`],
    [/aesop.?s fables/i, () => '伊索寓言'],
    [/fairy tales and stories/i, () => '安徒生童话与故事'],
    [/grimm.?s fairy tales/i, () => '格林童话'],
    [/andersen/i, () => '安徒生童话'],
    [/perrault/i, () => '佩罗童话'],
  ];
  for (const [re, fn] of rules) {
    const m = t.match(re);
    if (m) return fn(m);
  }
  return t;
}

// ---------- 入库 ----------
async function storyExists(title) {
  const row = await db.get('SELECT id FROM stories WHERE title = ?', [chineseTitle(title)]);
  return row ? row.id : null;
}

async function insertStory(book, episodes, coverUrl) {
  const author = (book.authors || []).map((a) => [a.first_name, a.last_name].filter(Boolean).join(' ')).join(', ') || 'LibriVox';
  const desc = String(book.description || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 200) ||
    '来自 LibriVox 的公有领域有声故事。';
  const totalSec = episodes.reduce((s, e) => s + e.duration, 0);
  const info = await db.run(
    `INSERT INTO stories (title, author, narrator, category_id, cover_url, description, audio_url, duration, play_count, status, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1, 0)`,
    [chineseTitle(book.title), author, 'LibriVox 志愿者', 1, coverUrl, desc, '', totalSec]
  );
  return info.insertId;
}

async function insertEpisodes(storyId, episodes) {
  let n = 0;
  for (let i = 0; i < episodes.length; i++) {
    const ep = episodes[i];
    // 未下载时保留远程直链（archive.org），--retry-download 时可据此补下
    if (!ep.audio_url && ep.url) ep.audio_url = ep.url;
    await db.run(
      'INSERT INTO episodes (story_id, title, episode_no, audio_url, duration) VALUES (?, ?, ?, ?, ?)',
      [storyId, ep.title, i + 1, ep.audio_url || '', ep.duration]
    );
    n++;
  }
  return n;
}

// ---------- 主流程 ----------
async function main() {
  console.log('=== LibriVox 音频导入 ===');
  if (OPT.dryRun) console.log('[dry-run] 只预览，不下载不入库');

  await db.init();
  await seed();

  if (OPT.retryDownload) {
    return retryDownloads();
  }

  console.log(`\n搜索关键词: ${OPT.keywords.join(', ')}`);
  const books = await searchBooks();
  console.log(`\n筛选后 ${books.length} 个作品（时长 < 6 小时）`);
  if (!books.length) { await db.close(); return; }

  let imported = 0, downloaded = 0, failed = 0;

  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    console.log(`\n[${i + 1}/${books.length}] ${book.title} (id=${book.id})`);

    const existId = await storyExists(book.title);
    if (existId) { console.log('  已存在，跳过'); continue; }

    let episodes;
    try {
      episodes = await fetchEpisodes(book);
    } catch (e) {
      console.log('  获取分集失败:', e.message);
      failed++;
      continue;
    }
    console.log(`  分集: ${episodes.length} 集`);
    if (!episodes.length) { failed++; continue; }

    const coverUrl = makeCover(book.title, i);

    if (OPT.dryRun) {
      episodes.slice(0, 3).forEach((e, j) => console.log(`    集${j + 1}: ${e.title} (${e.duration}s)`));
      continue;
    }

    const storyId = await insertStory(book, episodes, coverUrl);
    console.log(`  入库故事 id=${storyId}`);

    if (!OPT.skipDownload) {
      for (let j = 0; j < episodes.length; j++) {
        const ep = episodes[j];
        const ext = path.extname(new URL(ep.url).pathname) || '.mp3';
        const fname = `lv-${storyId}-${j + 1}${ext}`;
        const dest = path.join(config.audio.dir, fname);
        try {
          const size = await downloadFile(ep.url, dest);
          ep.audio_url = '/api/audio/' + fname;
          await db.run('UPDATE episodes SET audio_url = ? WHERE story_id = ? AND episode_no = ?',
            [ep.audio_url, storyId, j + 1]);
          downloaded++;
          console.log(`    集${j + 1} 下载成功 ${(size / 1024 / 1024).toFixed(1)}MB`);
        } catch (e) {
          console.log(`    集${j + 1} 下载失败(${e.message})，保留远程URL`);
          failed++;
        }
      }
      // 若第一集下载成功，故事 audio_url 指向它
      if (episodes[0] && episodes[0].audio_url.startsWith('/api/audio/')) {
        await db.run('UPDATE stories SET audio_url = ? WHERE id = ?', [episodes[0].audio_url, storyId]);
      }
    } else {
      await insertEpisodes(storyId, episodes);
      console.log('  跳过下载，分集保留远程URL');
    }
    imported++;
  }

  console.log(`\n=== 完成 ===`);
  console.log(`入库故事: ${imported} | 下载音频: ${downloaded} | 失败: ${failed}`);
  await db.close();
}

// 补下载：把 episodes 里还是远程 http URL 的音频尝试下载
async function retryDownloads() {
  const rows = await db.query("SELECT id, story_id, episode_no, audio_url FROM episodes WHERE audio_url LIKE 'http%'");
  console.log(`待补下载: ${rows.length} 集`);
  let ok = 0, fail = 0;
  for (const row of rows) {
    const ext = path.extname(new URL(row.audio_url).pathname) || '.mp3';
    const fname = `lv-${row.story_id}-${row.episode_no}${ext}`;
    const dest = path.join(config.audio.dir, fname);
    try {
      const size = await downloadFile(row.audio_url, dest);
      await db.run('UPDATE episodes SET audio_url = ? WHERE id = ?', ['/api/audio/' + fname, row.id]);
      ok++;
      console.log(`  ✓ ${fname} (${(size / 1024 / 1024).toFixed(1)}MB)`);
    } catch (e) {
      fail++;
      console.log(`  ✗ ${fname}: ${e.message}`);
    }
  }
  console.log(`补下载完成: 成功 ${ok}, 失败 ${fail}`);
  await db.close();
}

main().catch((e) => {
  console.error('导入失败:', e.stack || e.message);
  process.exit(1);
});
