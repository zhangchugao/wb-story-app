'use strict';
// 生成 tabBar 图标（81x81 PNG，透明底，线性几何风格）。无需任何第三方依赖。
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const OUT = path.resolve(__dirname, '../assets/tabbar');
fs.mkdirSync(OUT, { recursive: true });

function crc32(buf) {
  let crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    let c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
    crc = (c ^ (crc >>> 8)) & 0xffffffff;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}
function writePNG(file, w, h, px) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(px).copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const png = Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
  fs.writeFileSync(file, png);
}

const S = 81;
function canvas() { return Buffer.alloc(S * S * 4); }
function px(buf, x, y, c) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= S || y >= S) return;
  const i = (y * S + x) * 4;
  buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; buf[i + 3] = c === CLEAR ? 0 : 255;
}
const CLEAR = [0, 0, 0, 0];
function rect(buf, x, y, w, h, c) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) px(buf, i, j, c); }
function disc(buf, cx, cy, r, c) { for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) px(buf, x, y, c); }
function line(buf, x0, y0, x1, y1, w, c) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2;
  for (let t = 0; t <= n; t++) {
    const x = x0 + (x1 - x0) * t / n, y = y0 + (y1 - y0) * t / n;
    for (let dy = -w; dy <= w; dy++) for (let dx = -w; dx <= w; dx++) if (dx * dx + dy * dy <= w * w) px(buf, x + dx, y + dy, c);
  }
}

const GRAY = [156, 163, 175, 255];
const MINT = [16, 185, 129, 255];

function draw(kind, c) {
  const b = canvas();
  if (kind === 'home') {
    for (let y = 14; y <= 40; y++) { const half = (y - 14) / 26 * 25; for (let x = 40 - half; x <= 40 + half; x++) px(b, x, y, c); }
    rect(b, 22, 38, 37, 29, c);
    rect(b, 34, 50, 13, 17, CLEAR);
    rect(b, 45, 44, 8, 8, CLEAR);
  } else if (kind === 'category') {
    rect(b, 15, 15, 22, 22, c); rect(b, 44, 15, 22, 22, c);
    rect(b, 15, 44, 22, 22, c); rect(b, 44, 44, 22, 22, c);
  } else if (kind === 'search') {
    disc(b, 34, 34, 21, c); disc(b, 34, 34, 13, CLEAR);
    line(b, 49, 49, 66, 66, 5, c);
  } else if (kind === 'mine') {
    disc(b, 40, 27, 12, c);
    for (let y = 44; y <= 70; y++) for (let x = 16; x <= 64; x++) {
      const e = ((x - 40) ** 2) / (24 * 24) + ((y - 44) ** 2) / (26 * 26);
      if (e <= 1) px(b, x, y, c);
    }
  }
  return b;
}

['home', 'category', 'search', 'mine'].forEach((k) => {
  writePNG(path.join(OUT, `${k}.png`), S, S, draw(k, GRAY));
  writePNG(path.join(OUT, `${k}-active.png`), S, S, draw(k, MINT));
});
console.log('图标已生成：', fs.readdirSync(OUT).join(', '));
