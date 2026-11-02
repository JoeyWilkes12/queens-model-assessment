// Minimal static server that gzips like GitHub Pages: /queens-model-assessment/ -> dir, gzip for compressible types, max-age=600.
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib')
const [dir, port] = [process.argv[2], +process.argv[3]]
const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.md': 'text/markdown', '.txt': 'text/plain' }
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]).replace(/^\/queens-model-assessment/, '')
  if (p.endsWith('/')) p += 'index.html'
  const file = path.join(dir, p)
  if (!file.startsWith(dir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end() }
  const ext = path.extname(file), body = fs.readFileSync(file)
  const headers = { 'content-type': types[ext] || 'application/octet-stream', 'cache-control': 'max-age=600' }
  if (/gzip/.test(req.headers['accept-encoding'] || '') && ext !== '.png') { headers['content-encoding'] = 'gzip'; res.writeHead(200, headers); return res.end(zlib.gzipSync(body, { level: 6 })) }
  res.writeHead(200, headers); res.end(body)
}).listen(port)
