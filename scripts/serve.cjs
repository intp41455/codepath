#!/usr/bin/env node
/*
 * 极简静态服务：在 dist/ 上起一个本地 HTTP 服务。
 * 等价于 `cd dist && python -m http.server`，但零外部依赖（Node 内置 http）。
 *
 * 用法：
 *   node scripts/serve.cjs [端口]     # 默认 4317
 * 浏览器打开 http://127.0.0.1:<端口>/
 *
 * 代码运行依赖浏览器 Web Worker / 同源策略，必须走 HTTP 而非 file://，
 * 因此需要一个这样的本地服务。
 */
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const distRoot = path.resolve(__dirname, '..', 'dist');
const port = Number(process.argv[2] || process.env.PORT || 4317);
const host = '127.0.0.1';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.d.ts': 'text/plain; charset=utf-8',
  '.ts': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.zip': 'application/zip',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (urlPath === '/') urlPath = '/index.html';
    // 防止目录穿越：解析后仍须位于 distRoot 内
    const filePath = path.normalize(path.join(distRoot, urlPath));
    if (!filePath.startsWith(distRoot + path.sep)) {
      res.writeHead(403); res.end('Forbidden'); return;
    }
    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found: ' + urlPath);
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': TYPES[ext] || 'application/octet-stream',
        'Content-Length': stat.size,
        // 静态站点可缓存
        'Cache-Control': 'no-cache',
      });
      fs.createReadStream(filePath).pipe(res);
    });
  } catch (e) {
    res.writeHead(500); res.end('Server error: ' + e.message);
  }
});

server.listen(port, host, () => {
  console.log('循码 Codepath 静态服务已启动：http://' + host + ':' + port + '/');
  console.log('服务目录：' + distRoot);
  console.log('按 Ctrl+C 停止。');
});
