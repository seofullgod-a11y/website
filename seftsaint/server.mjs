/**
 * Production static server for the built site (dist/).
 * Zero dependencies — Node built-ins only. Used by `npm start` (Railway, Render, any VPS).
 *
 *  - listens on $PORT (Railway sets it automatically)
 *  - clean URLs: /work/forest-concept → dist/work/forest-concept/index.html
 *  - long cache for hashed assets, no-cache for HTML
 *  - gzip / brotli for text files
 *  - byte-range requests (needed for <video> on Safari / iOS)
 *  - real 404 page, /health for health checks
 */
import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');
const PORT = Number(process.env.PORT) || 4321;

if (!fs.existsSync(path.join(ROOT, 'index.html'))) {
  console.error('dist/index.html not found — run `npm run build` first.');
  process.exit(1);
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.pdf': 'application/pdf',
};
const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.mjs', '.json', '.txt', '.xml', '.svg', '.webmanifest']);

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

function cacheControl(urlPath, ext) {
  if (urlPath.startsWith('/_astro/')) return 'public, max-age=31536000, immutable'; // content-hashed
  if (ext === '.html') return 'public, max-age=0, must-revalidate';
  if (urlPath.startsWith('/fonts/')) return 'public, max-age=2592000'; // 30 days
  if (urlPath.startsWith('/media/')) return 'public, max-age=86400'; // 1 day — videos may be replaced
  return 'public, max-age=3600';
}

/** Resolve a URL path to a file inside dist/, never outside it. */
async function resolveFile(urlPath) {
  const safe = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  const base = path.join(ROOT, safe);
  if (!base.startsWith(ROOT)) return null;
  const candidates = urlPath.endsWith('/')
    ? [path.join(base, 'index.html')]
    : [base, `${base}.html`, path.join(base, 'index.html')];
  for (const file of candidates) {
    try {
      const stat = await fsp.stat(file);
      if (stat.isFile()) return { file, stat };
    } catch {
      /* try next */
    }
  }
  return null;
}

// Small in-memory cache of compressed text files (the whole site is tiny).
const compressed = new Map();
async function getCompressed(file, stat, encoding) {
  const key = `${file}:${encoding}:${stat.mtimeMs}`;
  if (compressed.has(key)) return compressed.get(key);
  const raw = await fsp.readFile(file);
  const out =
    encoding === 'br'
      ? zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9 } })
      : zlib.gzipSync(raw, { level: 9 });
  compressed.set(key, out);
  return out;
}

function pickEncoding(req, ext) {
  if (!COMPRESSIBLE.has(ext)) return null;
  const accept = String(req.headers['accept-encoding'] || '');
  if (/\bbr\b/.test(accept)) return 'br';
  if (/\bgzip\b/.test(accept)) return 'gzip';
  return null;
}

async function send(req, res, found, status, urlPath) {
  const { file, stat } = found;
  const ext = path.extname(file).toLowerCase();
  const etag = `W/"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
  const headers = {
    ...SECURITY_HEADERS,
    'Content-Type': TYPES[ext] || 'application/octet-stream',
    'Cache-Control': status === 404 ? 'no-cache' : cacheControl(urlPath, ext),
    'Last-Modified': stat.mtime.toUTCString(),
    ETag: etag,
    'Accept-Ranges': 'bytes',
    Vary: 'Accept-Encoding',
  };

  if (status === 200 && req.headers['if-none-match'] === etag) {
    res.writeHead(304, headers);
    return res.end();
  }

  // Byte ranges — video seeking and Safari playback.
  const range = req.headers.range;
  if (status === 200 && range && !COMPRESSIBLE.has(ext)) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (m) {
      let start = m[1] === '' ? Math.max(0, stat.size - Number(m[2])) : Number(m[1]);
      let end = m[1] !== '' && m[2] !== '' ? Number(m[2]) : stat.size - 1;
      if (m[1] === '' && m[2] === '') start = NaN;
      end = Math.min(end, stat.size - 1);
      if (Number.isNaN(start) || start < 0 || start > end) {
        res.writeHead(416, { ...headers, 'Content-Range': `bytes */${stat.size}` });
        return res.end();
      }
      res.writeHead(206, {
        ...headers,
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Content-Length': end - start + 1,
      });
      if (req.method === 'HEAD') return res.end();
      return fs.createReadStream(file, { start, end }).pipe(res);
    }
  }

  const encoding = pickEncoding(req, ext);
  if (encoding) {
    const body = await getCompressed(file, stat, encoding);
    res.writeHead(status, { ...headers, 'Content-Encoding': encoding, 'Content-Length': body.length });
    return res.end(req.method === 'HEAD' ? undefined : body);
  }

  res.writeHead(status, { ...headers, 'Content-Length': stat.size });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' });
      return res.end();
    }

    let urlPath;
    try {
      urlPath = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname);
    } catch {
      res.writeHead(400);
      return res.end('Bad request');
    }

    if (urlPath === '/health') {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end('ok');
    }

    const found = await resolveFile(urlPath);
    if (found) return await send(req, res, found, 200, urlPath);

    const notFound = await resolveFile('/404.html');
    if (notFound) return await send(req, res, notFound, 404, urlPath);
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Server error');
  }
});

server.listen(PORT, () => {
  console.log(`seftsaint → serving dist/ on port ${PORT}`);
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  });
}
