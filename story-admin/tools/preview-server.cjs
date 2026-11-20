'use strict';
// 临时预览服务器：托管 dist/ + 代理 /api /static 到后端，用于联调验证。纯 Node 内置模块，零依赖。
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST = path.resolve(__dirname, '../dist');
const PORT = 5180;
const BACKEND = { host: '127.0.0.1', port: 3000 };

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};

function proxy(req, res) {
  const upstream = http.request(
    { hostname: BACKEND.host, port: BACKEND.port, path: req.url, method: req.method, headers: req.headers },
    (up) => { res.writeHead(up.statusCode, up.headers); up.pipe(res); }
  );
  upstream.on('error', () => { res.writeHead(502); res.end('backend unavailable'); });
  req.pipe(upstream);
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath.startsWith('/api/') || urlPath.startsWith('/static/')) return proxy(req, res);

  let file = path.join(DIST, urlPath === '/' ? 'index.html' : urlPath);
  if (!file.startsWith(DIST)) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html');

  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => console.log(`preview server on http://localhost:${PORT}`));
