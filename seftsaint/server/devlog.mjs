/**
 * Devlog — the part of the server that isn't static.
 *
 *  · /studio/api/*          private API for the upload page (/studio), password = STUDIO_PASSWORD
 *  · /devlog-media/<id>/…   the processed clips, stills and posters
 *  · inject()               drops the entries into the static pages (<!--devlog:…--> markers)
 *
 * Storage: a Railway volume (RAILWAY_VOLUME_MOUNT_PATH, set by Railway when a volume is
 * attached) or DEVLOG_DIR; locally ./data. Layout:
 *   <volume>/devlog/entries.json
 *   <volume>/devlog/<id>/upload.bin   (while uploading / processing — deleted afterwards)
 *   <volume>/devlog/<id>/clip.mp4 · preview.mp4 · poster.jpg · image.jpg
 *
 * Every upload is re-encoded by ffmpeg (ffmpeg-static, or ffmpeg on PATH): H.264 MP4 for
 * any phone or browser, a short muted preview for the autoplay loops, and a poster. The
 * original file is never served.
 */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';
import { createRenderer } from './render.mjs';

const MiB = 1024 * 1024;
const MAX_UPLOAD = 1536 * MiB; // one file
const MAX_CHUNK = 16 * MiB; // one request (Railway: a request body must finish within 5 minutes)
const MAX_SECONDS = 300; // clips are cut at 5 minutes
const SESSION_DAYS = 30;
const ID = /^[a-f0-9]{12}$/;
const FILES = new Set(['clip.mp4', 'preview.mp4', 'poster.jpg', 'image.jpg']);

export function createDevlog({ appRoot, distRoot, sendFile }) {
  /* ── Config from the build (categories, labels, projects, builds on X) ── */
  let cfg = null;
  try {
    cfg = JSON.parse(fs.readFileSync(path.join(distRoot, 'devlog', 'config.json'), 'utf8'));
  } catch {
    console.warn('[devlog] dist/devlog/config.json missing — devlog off');
  }
  const render = cfg ? createRenderer(cfg) : null;
  const catKeys = new Set(cfg?.categories.map((c) => c.key) ?? []);
  const projectKeys = new Set(cfg?.projects.map((p) => p.slug) ?? []);
  const timeZone = cfg?.timeZone || 'Asia/Bangkok';
  const today = () =>
    new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

  /* ── Where things live ── */
  const onRailway = Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID || process.env.RAILWAY_SERVICE_ID);
  const volume = process.env.DEVLOG_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || '';
  // On Railway without a volume the disk is wiped on every deploy — uploads are refused there.
  const persistent = Boolean(volume) || !onRailway;
  const DATA = path.join(volume || path.join(appRoot, 'data'), 'devlog');
  fs.mkdirSync(DATA, { recursive: true });
  const DB_FILE = path.join(DATA, 'entries.json');
  const entryDir = (id) => path.join(DATA, id);

  /* ── ffmpeg ── */
  const ffmpeg = (() => {
    const tries = [];
    if (process.env.FFMPEG_PATH) tries.push(process.env.FFMPEG_PATH);
    try {
      const p = createRequire(import.meta.url)('ffmpeg-static');
      if (p) tries.push(p);
    } catch {
      /* not installed */
    }
    tries.push('ffmpeg');
    for (const bin of tries) {
      const r = spawnSync(bin, ['-hide_banner', '-version'], { encoding: 'utf8' });
      if (r.status === 0) return bin;
    }
    return null;
  })();
  if (!ffmpeg) console.warn('[devlog] ffmpeg not found — uploads will wait until it is installed');

  /* ── Entries ── */
  let db = { version: 1, entries: [] };
  try {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    if (!Array.isArray(db.entries)) db.entries = [];
  } catch {
    /* first run */
  }
  let rev = 1;
  /** Pages with the entries already put in, by content + filter + day + data revision. */
  const injected = new Map();
  const save = () => {
    const tmp = `${DB_FILE}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
    fs.renameSync(tmp, DB_FILE);
    rev++;
    injected.clear();
  };
  const find = (id) => db.entries.find((e) => e.id === id);

  /* ── Password + session ── */
  const PASSWORD = process.env.STUDIO_PASSWORD || '';
  const secretFile = path.join(DATA, '.secret');
  let secret;
  try {
    secret = fs.readFileSync(secretFile, 'utf8').trim();
  } catch {
    secret = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(secretFile, secret, { mode: 0o600 });
  }
  // Changing STUDIO_PASSWORD signs everyone out.
  const key = crypto.createHash('sha256').update(`${PASSWORD}\0${secret}`).digest();
  const sign = (exp) => crypto.createHmac('sha256', key).update(`studio:${exp}`).digest('base64url');
  const same = (a, b) => {
    const x = crypto.createHash('sha256').update(String(a)).digest();
    const y = crypto.createHash('sha256').update(String(b)).digest();
    return crypto.timingSafeEqual(x, y);
  };
  const cookies = (req) =>
    Object.fromEntries(
      String(req.headers.cookie || '')
        .split(';')
        .map((c) => c.trim().split('='))
        .filter((p) => p.length === 2),
    );
  const authed = (req) => {
    if (!PASSWORD) return false;
    const [exp, sig] = String(cookies(req).ss_studio || '').split('.');
    return Number(exp) > Date.now() && !!sig && same(sig, sign(exp));
  };
  const secure = (req) => req.headers['x-forwarded-proto'] === 'https' || !!req.socket.encrypted;
  const setSession = (req, res, on) => {
    const exp = Date.now() + SESSION_DAYS * 864e5;
    const value = on ? `${exp}.${sign(exp)}` : '';
    res.setHeader(
      'Set-Cookie',
      `ss_studio=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${on ? SESSION_DAYS * 86400 : 0}${secure(req) ? '; Secure' : ''}`,
    );
  };
  /** Only the site itself may change things (the cookie is also SameSite=Strict). */
  const sameOrigin = (req) => {
    const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
    const from = req.headers.origin || req.headers.referer;
    if (!from || !host) return false;
    try {
      return new URL(from).host === host;
    } catch {
      return false;
    }
  };
  // Wrong passwords: 10 per 15 minutes per address, 60 in total.
  const attempts = new Map();
  const limited = (req) => {
    const now = Date.now();
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '?');
    for (const k of [ip, '*']) {
      const a = attempts.get(k);
      if (a && a.reset < now) attempts.delete(k);
    }
    const a = attempts.get(ip);
    const all = attempts.get('*');
    return (a && a.n >= 10) || (all && all.n >= 60);
  };
  const failed = (req) => {
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '?');
    for (const k of [ip, '*']) {
      const a = attempts.get(k) ?? { n: 0, reset: Date.now() + 15 * 60e3 };
      a.n++;
      attempts.set(k, a);
    }
  };

  /* ── Small HTTP helpers ── */
  const json = (res, status, body, extra = {}) => {
    const s = JSON.stringify(body);
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex',
      ...extra,
    });
    res.end(s);
  };
  const readJson = async (req, limit = 64 * 1024) => {
    let size = 0;
    const chunks = [];
    for await (const c of req) {
      size += c.length;
      if (size > limit) throw Object.assign(new Error('too large'), { status: 413 });
      chunks.push(c);
    }
    if (!size) return {};
    try {
      return JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      throw Object.assign(new Error('bad json'), { status: 400 });
    }
  };

  /* ── Validation ── */
  const text = (v, max) =>
    String(v ?? '')
      .replace(/\r\n?/g, '\n')
      .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '')
      .trim()
      .slice(0, max);
  const validDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));
  function clean(input, { partial = false } = {}) {
    const out = {};
    const has = (k) => Object.prototype.hasOwnProperty.call(input, k);
    if (!partial || has('date')) {
      const d = text(input.date, 10) || today();
      if (!validDate(d)) throw Object.assign(new Error('date'), { status: 422 });
      out.date = d;
    }
    if (!partial || has('category')) {
      if (!catKeys.has(input.category)) throw Object.assign(new Error('category'), { status: 422 });
      out.category = input.category;
    }
    if (!partial || has('project')) {
      const p = input.project || cfg?.featured || null;
      if (p && !projectKeys.has(p)) throw Object.assign(new Error('project'), { status: 422 });
      out.project = p;
    }
    if (!partial || has('title')) {
      out.title = text(input.title, 120).replace(/\n+/g, ' ');
      if (!out.title) throw Object.assign(new Error('title'), { status: 422 });
    }
    if (!partial || has('text')) out.text = text(input.text, 1200);
    if (!partial || has('link')) {
      const l = text(input.link, 500);
      if (l && !/^https?:\/\/[^\s"<>]+$/i.test(l)) throw Object.assign(new Error('link'), { status: 422 });
      out.link = l;
    }
    if (has('hidden')) out.hidden = Boolean(input.hidden);
    return out;
  }

  /* ── Media processing ── */
  const run = (args, { timeout = 30 * 60e3 } = {}) =>
    new Promise((resolve, reject) => {
      const p = spawn(ffmpeg, args, { stdio: ['ignore', 'ignore', 'pipe'] });
      let err = '';
      p.stderr.on('data', (d) => {
        err = (err + d).slice(-8000);
      });
      const t = setTimeout(() => p.kill('SIGKILL'), timeout);
      p.on('error', reject);
      p.on('close', (code) => {
        clearTimeout(t);
        code === 0 ? resolve(err) : reject(new Error(err.trim().split('\n').slice(-3).join(' ') || `ffmpeg exited ${code}`));
      });
    });

  /** What is this file? (ffmpeg prints it and exits — ffprobe isn't needed.) */
  const probe = (file) =>
    new Promise((resolve) => {
      const p = spawn(ffmpeg, ['-hide_banner', '-i', file], { stdio: ['ignore', 'ignore', 'pipe'] });
      let err = '';
      p.stderr.on('data', (d) => (err += d));
      p.on('error', () => resolve(null));
      p.on('close', () => {
        const format = /Input #0, ([^,\n]+(?:,[^,\n ]+)*),/.exec(err)?.[1] ?? '';
        const dur = /Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/.exec(err);
        const v = /Stream #0:\d+[^\n]*?: Video: (\w+)[^\n]*/.exec(err);
        const dims = v ? /, (\d{2,5})x(\d{2,5})[ ,\[]/.exec(v[0]) : null;
        const rot = /rotation of (-?\d+(?:\.\d+)?) degrees/.exec(err);
        const swap = rot && Math.abs(Math.round(Number(rot[1]))) % 180 === 90;
        const duration = dur ? Number(dur[1]) * 3600 + Number(dur[2]) * 60 + Number(dur[3]) : 0;
        const codec = v?.[1] ?? '';
        const still =
          /_pipe|image2|^png|^webp|^bmp|^tiff/.test(format) ||
          (['png', 'mjpeg', 'webp', 'bmp', 'tiff', 'jpegls'].includes(codec) && duration < 0.2);
        resolve({
          format,
          codec,
          duration,
          width: dims ? Number(dims[swap ? 2 : 1]) : 0,
          height: dims ? Number(dims[swap ? 1 : 2]) : 0,
          video: !!v,
          audio: /Stream #0:\d+[^\n]*?: Audio:/.test(err),
          still,
          hdr: !!v && /bt2020/.test(v[0]) && /smpte2084|arib-std-b67/.test(v[0]),
        });
      });
    });

  /** Longest side ≤ n, even dimensions. HDR phone clips are tone-mapped to normal range first. */
  const fit = (n, hdr) =>
    [
      hdr
        ? 'zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv'
        : '',
      `scale='if(gte(iw,ih),trunc(min(${n},iw)/2)*2,-2)':'if(gte(iw,ih),-2,trunc(min(${n},ih)/2)*2)'`,
      'format=yuv420p',
    ]
      .filter(Boolean)
      .join(',');

  async function processEntry(id) {
    const e = find(id);
    if (!e) return;
    const dir = entryDir(id);
    const src = path.join(dir, 'upload.bin');
    const out = (f) => path.join(dir, f);
    const tmp = (f) => path.join(dir, `tmp-${f}`);
    try {
      if (!ffmpeg) throw new Error('ffmpeg is not available on the server');
      const info = await probe(src);
      if (!info || !info.video) throw new Error('This file is not a video or an image ffmpeg can read.');
      const Q = ['-hide_banner', '-loglevel', 'error', '-y'];
      if (info.still) {
        await run([...Q, '-i', src, '-frames:v', '1', '-vf', fit(2048, false).replace('yuv420p', 'yuvj420p'), '-q:v', '3', tmp('image.jpg')]);
        await run([...Q, '-i', tmp('image.jpg'), '-vf', fit(1280, false).replace('yuv420p', 'yuvj420p'), '-q:v', '4', tmp('poster.jpg')]);
        for (const f of ['image.jpg', 'poster.jpg']) await fsp.rename(tmp(f), out(f));
        const done = await probe(out('image.jpg'));
        e.media = { type: 'image', w: done?.width || info.width, h: done?.height || info.height };
      } else {
        const x264 = ['-c:v', 'libx264', '-preset', 'veryfast', '-profile:v', 'high', '-threads', '2'];
        // The clip people watch, with sound
        await run([
          ...Q, '-i', src, '-t', String(MAX_SECONDS), '-map', '0:v:0', '-map', '0:a:0?',
          '-vf', fit(1920, info.hdr), ...x264, '-crf', '23', '-maxrate', '8M', '-bufsize', '16M', '-fpsmax', '60',
          '-c:a', 'aac', '-b:a', '128k', '-ac', '2', '-movflags', '+faststart', tmp('clip.mp4'),
        ]);
        // The quiet loop on the page: first 8 s, smaller, no sound
        await run([
          ...Q, '-i', src, '-t', '8', '-map', '0:v:0', '-an', '-vf', fit(960, info.hdr), ...x264,
          '-crf', '27', '-maxrate', '1500k', '-bufsize', '3000k', '-fpsmax', '30', '-movflags', '+faststart', tmp('preview.mp4'),
        ]);
        const at = info.duration ? Math.min(1, info.duration * 0.25) : 0;
        await run([...Q, '-ss', at.toFixed(2), '-i', src, '-frames:v', '1', '-vf', fit(1280, info.hdr).replace('yuv420p', 'yuvj420p'), '-q:v', '4', tmp('poster.jpg')]);
        for (const f of ['clip.mp4', 'preview.mp4', 'poster.jpg']) await fsp.rename(tmp(f), out(f));
        const done = await probe(out('clip.mp4'));
        e.media = {
          type: 'video',
          w: done?.width || info.width,
          h: done?.height || info.height,
          duration: Math.round((done?.duration || info.duration) * 10) / 10,
        };
      }
      e.media.v = Date.now().toString(36);
      e.status = 'live';
      delete e.error;
      await fsp.rm(src, { force: true });
    } catch (err) {
      console.error(`[devlog] ${id}:`, err.message);
      e.status = 'failed';
      e.error = String(err.message || err).slice(0, 300);
      for (const f of FILES) await fsp.rm(tmp(f), { force: true }).catch(() => {});
    }
    e.updatedAt = new Date().toISOString();
    save();
  }

  const queue = [];
  let busy = false;
  const enqueue = (id) => {
    if (!queue.includes(id)) queue.push(id);
    pump();
  };
  async function pump() {
    if (busy) return;
    const id = queue.shift();
    if (!id) return;
    busy = true;
    try {
      await processEntry(id);
    } finally {
      busy = false;
      pump();
    }
  }

  // After a restart: finish what was being processed, forget uploads abandoned for a day.
  for (const e of [...db.entries]) {
    if (e.status === 'processing') {
      if (fs.existsSync(path.join(entryDir(e.id), 'upload.bin'))) enqueue(e.id);
      else Object.assign(e, { status: 'failed', error: 'The upload was lost during a restart — please upload it again.' });
    } else if (e.status === 'uploading' && Date.now() - Date.parse(e.createdAt) > 864e5) {
      db.entries = db.entries.filter((x) => x !== e);
      fs.rmSync(entryDir(e.id), { recursive: true, force: true });
    }
  }
  if (db.entries.length) save();

  /* ── What the public sees ── */
  const mediaUrl = (e, f) => `/devlog-media/${e.id}/${f}?v=${e.media?.v ?? 1}`;
  function publicEntries() {
    const own = db.entries
      .filter((e) => e.status === 'live' && !e.hidden)
      .map((e) => ({
        id: e.id,
        date: e.date,
        createdAt: e.createdAt,
        project: e.project,
        category: e.category,
        title: e.title,
        text: e.text,
        link: e.link,
        media: e.media
          ? e.media.type === 'video'
            ? { type: 'video', poster: mediaUrl(e, 'poster.jpg'), preview: mediaUrl(e, 'preview.mp4'), clip: mediaUrl(e, 'clip.mp4'), duration: e.media.duration, w: e.media.w, h: e.media.h, alt: '' }
            : { type: 'image', poster: mediaUrl(e, 'poster.jpg'), image: mediaUrl(e, 'image.jpg'), w: e.media.w, h: e.media.h, alt: '' }
          : null,
      }));
    return [...(cfg?.seeds ?? []), ...own];
  }

  /* ── Put the entries into a static page ── */
  const MARK = /<!--devlog:([a-z]+)(?::([a-z0-9-]+))?-->[\s\S]*?<!--\/devlog-->/g;
  function inject(html, query) {
    if (!render || !html.includes('<!--devlog:')) return null;
    const active = catKeys.has(query.get('c')) ? query.get('c') : '';
    const t = today();
    const k = `${html.length}:${active}:${t}:${rev}:${crypto.createHash('md5').update(html).digest('hex')}`;
    if (injected.has(k)) return injected.get(k);
    const all = publicEntries();
    const out = html.replace(MARK, (_, name, arg) => {
      if (name === 'latest') return render.latest(all, t);
      if (name === 'list') return render.list(all, t, active);
      if (name === 'filters') return render.filters(all, active);
      if (name === 'stats') return render.stats(all, t);
      if (name === 'project') return render.project(all, t, arg, cfg.labels.kicker);
      return '';
    });
    const result = { html: out, etag: `W/"dl-${crypto.createHash('md5').update(k).digest('hex').slice(0, 16)}"` };
    if (injected.size > 200) injected.clear();
    injected.set(k, result);
    return result;
  }

  /* ── /devlog-media/<id>/<file> ── */
  async function serveMedia(req, res, urlPath) {
    const [, , id, file] = urlPath.split('/');
    const e = ID.test(id || '') && FILES.has(file || '') ? find(id) : null;
    if (!e || e.status !== 'live' || (e.hidden && !authed(req))) return false;
    const f = path.join(entryDir(id), file);
    try {
      const stat = await fsp.stat(f);
      await sendFile(req, res, { file: f, stat }, 200, urlPath, { cache: 'public, max-age=31536000, immutable' });
      return true;
    } catch {
      return false;
    }
  }

  /* ── /studio/api/* ── */
  const studioEntry = (e) => ({
    ...e,
    thumb: e.status === 'live' && e.media ? mediaUrl(e, 'poster.jpg') : null,
    clip: e.status === 'live' && e.media?.type === 'video' ? mediaUrl(e, 'clip.mp4') : null,
    received: e.status === 'uploading' ? fileSize(path.join(entryDir(e.id), 'upload.bin')) : undefined,
  });
  const fileSize = (f) => {
    try {
      return fs.statSync(f).size;
    } catch {
      return 0;
    }
  };
  const disk = () => {
    try {
      const s = fs.statfsSync(DATA);
      return { free: s.bavail * s.bsize, total: s.blocks * s.bsize };
    } catch {
      return null;
    }
  };

  async function handleApi(req, res, urlPath, query) {
    const parts = urlPath.replace(/^\/studio\/api\/?/, '').split('/').filter(Boolean);
    const method = req.method;
    const write = method !== 'GET' && method !== 'HEAD';

    if (parts[0] === 'session' && method === 'GET') {
      const ok = authed(req);
      return json(res, 200, {
        enabled: Boolean(PASSWORD) && Boolean(cfg),
        authed: ok,
        ...(ok
          ? {
              persistent,
              onRailway,
              ffmpeg: Boolean(ffmpeg),
              disk: disk(),
              today: today(),
              config: { categories: cfg.categories, projects: cfg.projects, featured: cfg.featured },
              queue: queue.length + (busy ? 1 : 0),
            }
          : {}),
      });
    }
    if (!PASSWORD || !cfg) return json(res, 403, { error: 'disabled' });
    if (write && !sameOrigin(req)) return json(res, 403, { error: 'origin' });

    if (parts[0] === 'login' && method === 'POST') {
      if (limited(req)) return json(res, 429, { error: 'too-many' });
      const body = await readJson(req);
      if (typeof body.password === 'string' && same(body.password, PASSWORD)) {
        setSession(req, res, true);
        return json(res, 200, { ok: true });
      }
      failed(req);
      await new Promise((r) => setTimeout(r, 400));
      return json(res, 401, { error: 'wrong-password' });
    }
    if (parts[0] === 'logout' && method === 'POST') {
      setSession(req, res, false);
      return json(res, 200, { ok: true });
    }

    if (!authed(req)) return json(res, 401, { error: 'signed-out' });
    if (parts[0] !== 'entries') return json(res, 404, { error: 'not-found' });

    // /entries
    if (parts.length === 1) {
      if (method === 'GET') {
        const list = [...db.entries].sort((a, b) =>
          a.date === b.date ? String(b.createdAt).localeCompare(String(a.createdAt)) : b.date.localeCompare(a.date),
        );
        return json(res, 200, { entries: list.map(studioEntry) });
      }
      if (method === 'POST') {
        // On Railway without a volume everything would vanish at the next deploy — so nothing is taken.
        if (!persistent) return json(res, 409, { error: 'no-volume' });
        const body = await readJson(req);
        const fields = clean(body);
        const file = body.file;
        if (file) {
          const size = Number(file.size);
          if (!Number.isInteger(size) || size <= 0) return json(res, 422, { error: 'file' });
          if (size > MAX_UPLOAD) return json(res, 413, { error: 'file-too-large', max: MAX_UPLOAD });
          const d = disk();
          if (d && d.free < size * 2.2) return json(res, 507, { error: 'disk-full', free: d.free });
        }
        const now = new Date().toISOString();
        const e = {
          id: crypto.randomBytes(6).toString('hex'),
          ...fields,
          hidden: Boolean(body.hidden),
          createdAt: now,
          updatedAt: now,
          status: file ? 'uploading' : 'live',
          ...(file ? { upload: { size: Number(file.size), name: text(file.name, 120), type: text(file.type, 80) } } : {}),
          media: null,
        };
        fs.mkdirSync(entryDir(e.id), { recursive: true });
        db.entries.push(e);
        save();
        return json(res, 201, { entry: studioEntry(e) });
      }
      return json(res, 405, { error: 'method' });
    }

    const id = parts[1];
    const e = ID.test(id) ? find(id) : null;
    if (!e) return json(res, 404, { error: 'not-found' });
    const dir = entryDir(id);
    const up = path.join(dir, 'upload.bin');

    // /entries/:id/upload — resumable, in chunks
    if (parts[2] === 'upload') {
      const received = fileSize(up);
      if (method === 'GET') return json(res, 200, { received, size: e.upload?.size ?? 0 });
      if (method !== 'PUT') return json(res, 405, { error: 'method' });
      if (e.status !== 'uploading') return json(res, 409, { error: 'state', status: e.status });
      const offset = Number(query.get('offset'));
      if (offset !== received) return json(res, 409, { error: 'offset', received });
      const len = Number(req.headers['content-length']);
      if (!Number.isInteger(len) || len <= 0 || len > MAX_CHUNK || received + len > e.upload.size)
        return json(res, 413, { error: 'chunk', received });
      let got = 0;
      const counter = new Transform({
        transform(chunk, _enc, cb) {
          got += chunk.length;
          cb(got > len ? new Error('chunk longer than announced') : null, chunk);
        },
      });
      try {
        await pipeline(req, counter, fs.createWriteStream(up, { flags: 'a' }));
      } catch {
        return json(res, 400, { error: 'interrupted', received: fileSize(up) });
      }
      return json(res, 200, { received: fileSize(up) });
    }

    // /entries/:id/process — the whole file is here, make it web-ready
    if (parts[2] === 'process' && method === 'POST') {
      if (e.status !== 'uploading') return json(res, 409, { error: 'state', status: e.status });
      if (fileSize(up) !== e.upload?.size) return json(res, 409, { error: 'incomplete', received: fileSize(up) });
      e.status = 'processing';
      e.updatedAt = new Date().toISOString();
      save();
      enqueue(id);
      return json(res, 202, { entry: studioEntry(e) });
    }

    if (parts[2] === 'retry' && method === 'POST') {
      if (e.status !== 'failed' || !fs.existsSync(up)) return json(res, 409, { error: 'state' });
      e.status = 'processing';
      save();
      enqueue(id);
      return json(res, 202, { entry: studioEntry(e) });
    }

    if (parts.length === 2 && method === 'PATCH') {
      const body = await readJson(req);
      Object.assign(e, clean(body, { partial: true }), { updatedAt: new Date().toISOString() });
      save();
      return json(res, 200, { entry: studioEntry(e) });
    }

    if (parts.length === 2 && method === 'DELETE') {
      db.entries = db.entries.filter((x) => x !== e);
      const qi = queue.indexOf(id);
      if (qi >= 0) queue.splice(qi, 1);
      save();
      await fsp.rm(dir, { recursive: true, force: true });
      return json(res, 200, { ok: true });
    }

    return json(res, 405, { error: 'method' });
  }

  async function api(req, res, urlPath, query) {
    try {
      await handleApi(req, res, urlPath, query);
    } catch (err) {
      if (res.headersSent) return res.end();
      json(res, err.status || 500, { error: err.status ? err.message : 'server' });
      if (!err.status) console.error('[devlog]', err);
    }
  }

  console.log(
    `[devlog] storage ${DATA}${persistent ? '' : ' (NOT persistent — attach a Railway volume)'} · ffmpeg ${ffmpeg ? 'ok' : 'missing'} · studio ${PASSWORD ? 'on' : 'off (set STUDIO_PASSWORD)'}`,
  );

  return { api, serveMedia, inject };
}
