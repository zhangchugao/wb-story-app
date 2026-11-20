'use strict';

// 封面配色（渐变用），索引 = id % 长度
const PALETTE = [
  ['#FFE0D2', '#FFAB91'],
  ['#D7F0E4', '#80DEB1'],
  ['#D9E7FF', '#92B4F4'],
  ['#FFF0C2', '#FFD166'],
  ['#E8DEFF', '#B39DDB'],
  ['#D2F3F0', '#6FCFBF'],
];

const categories = [
  { id: 1, name: '童话寓言', icon: 'fairy', desc: '奇妙的想象世界' },
  { id: 2, name: '睡前故事', icon: 'sleep', desc: '温柔入眠' },
  { id: 3, name: '历史传奇', icon: 'history', desc: '穿越千年' },
  { id: 4, name: '科普百科', icon: 'science', desc: '探索未知' },
  { id: 5, name: '悬疑探案', icon: 'mystery', desc: '烧脑推理' },
];

const stories = [
  { id: 1, title: '小红帽', author: '格林兄弟', narrator: '甜甜姐姐', category_id: 1, description: '经典童话，告诉孩子不要轻信陌生人。', duration: 312, play_count: 12840, tag: '经典' },
  { id: 2, title: '三只小猪', author: '佚名', narrator: '甜甜姐姐', category_id: 1, description: '勤劳和智慧，才能盖起最结实的房子。', duration: 428, play_count: 9632, tag: '趣味' },
  { id: 3, title: '月亮的秘密', author: '原创', narrator: '阿哲哥哥', category_id: 2, description: '温柔的睡前故事，陪孩子安稳入梦。', duration: 605, play_count: 7421, tag: '助眠' },
  { id: 4, title: '少年将军霍去病', author: '历史组', narrator: '老韩', category_id: 3, description: '匈奴未灭，何以家为。', duration: 910, play_count: 5380, tag: '励志' },
  { id: 5, title: '十万个为什么·天空篇', author: '科普组', narrator: '小林老师', category_id: 4, description: '天为什么是蓝色的？云为什么会下雨？', duration: 756, play_count: 4120, tag: '涨知识' },
  { id: 6, title: '消失的宝石', author: '悬疑组', narrator: '阿哲哥哥', category_id: 5, description: '一场发生在古堡里的离奇失窃案。', duration: 1180, play_count: 3315, tag: '推理' },
];

function decorate(s) {
  const pair = PALETTE[(s.id - 1) % PALETTE.length];
  return Object.assign({}, s, {
    coverFrom: pair[0], coverTo: pair[1],
    durationText: formatTime(s.duration),
    playText: s.play_count >= 10000 ? (s.play_count / 10000).toFixed(1) + '万' : String(s.play_count),
  });
}

function formatTime(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return m + ':' + (s < 10 ? '0' + s : s);
}

const hotStories = stories.slice().sort((a, b) => b.play_count - a.play_count).map(decorate);
const hotKeywords = ['小红帽', '睡前故事', '三只小猪', '科普', '悬疑'];

function filterStories(params = {}) {
  let list = stories.slice();
  if (params.categoryId) list = list.filter((s) => s.category_id === Number(params.categoryId));
  if (params.keyword) {
    const k = String(params.keyword).trim().toLowerCase();
    list = list.filter((s) => (s.title + s.author + s.description).toLowerCase().indexOf(k) >= 0);
  }
  if (params.sort === 'hot') list.sort((a, b) => b.play_count - a.play_count);
  const page = Number(params.page) || 1;
  const pageSize = Number(params.pageSize) || 20;
  return {
    total: list.length, page, pageSize,
    list: list.slice((page - 1) * pageSize, page * pageSize).map(decorate),
  };
}

function detail(id) {
  const raw = stories.find((s) => s.id === Number(id)) || stories[0];
  const base = decorate(raw);
  const hasEpisodes = raw.id === 6;
  return Object.assign({}, base, {
    episodes: hasEpisodes ? [
      { id: 1, story_id: 6, title: '第一章 · 古堡来客', episode_no: 1, duration: 580, durationText: '9:40' },
      { id: 2, story_id: 6, title: '第二章 · 失踪的宝石', episode_no: 2, duration: 600, durationText: '10:00' },
    ] : [],
    favorited: false, progress: null,
  });
}

const favorites = [decorate(stories[0]), decorate(stories[2])];
const history = [
  Object.assign(decorate(stories[0]), { position: 123, durationRaw: stories[0].duration, positionText: '2:03' }),
  Object.assign(decorate(stories[4]), { position: 456, durationRaw: stories[4].duration, positionText: '7:36' }),
];

module.exports = {
  categories, hotStories, hotKeywords, filterStories, detail, favorites, history,
  decorate, formatTime, PALETTE,
};
