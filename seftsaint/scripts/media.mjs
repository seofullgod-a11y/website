#!/usr/bin/env node
/**
 * npm run media — turn original recordings into web-ready files.
 *
 *   media-src/<project>/<name>.(mov|mp4|mkv|webm|m4v)
 *        ↓
 *   public/media/<project>/<name>.mp4          full demo  (H.264, ≤1920px, AAC, fast start)
 *   public/media/<project>/<name>-preview.mp4  short loop (8 s, ≤1280px, no audio, ~1–2 MB)
 *   src/assets/media/<project>/<name>.jpg      poster frame (only with --posters, or if missing)
 *
 * Name the source file like the entry in projects.ts / updates.ts, e.g.
 *   media-src/forest-concept/2026-09-25-last-update.mov
 *
 * Optional per-file settings: a JSON file next to the video with the same name,
 *   media-src/forest-concept/2026-09-25-last-update.json → { "previewStart": 31.5, "previewLength": 8 }
 *
 * Flags:
 *   --posters   also (re)write poster images — replaces the interim frames
 *   --force     rebuild even if outputs are newer than the source
 *   --only=name process only files whose name contains this text
 *
 * Needs ffmpeg + ffprobe on your PATH (macOS: `brew install ffmpeg`).
 * media-src/ is git-ignored — originals stay on your computer.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'media-src');
const OUT_VIDEO = path.join(ROOT, 'public', 'media');
const OUT_IMAGE = path.join(ROOT, 'src', 'assets', 'media');
const EXT = new Set(['.mov', '.mp4', '.mkv', '.webm', '.m4v']);

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const only = args.find((a) => a.startsWith('--only='))?.split('=')[1];

const has = (bin) => spawnSync(bin, ['-version'], { stdio: 'ignore' }).status === 0;
if (!has('ffmpeg') || !has('ffprobe')) {
  console.error('ffmpeg / ffprobe not found. macOS: brew install ffmpeg · Windows: winget install ffmpeg');
  process.exit(1);
}
if (!fs.existsSync(SRC)) {
  fs.mkdirSync(SRC, { recursive: true });
  console.log('Created media-src/. Put originals in media-src/<project>/<name>.mov and run again.');
  process.exit(0);
}

const run = (argv) => {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...argv], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${argv.join(' ')}`);
};
const probe = (file) => {
  const r = spawnSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration:stream=codec_type,width,height', '-of', 'json', file],
    { encoding: 'utf8' },
  );
  const j = JSON.parse(r.stdout || '{}');
  const v = (j.streams || []).find((s) => s.codec_type === 'video') || {};
  return {
    duration: Number(j.format?.duration) || 0,
    width: v.width || 0,
    height: v.height || 0,
    audio: (j.streams || []).some((s) => s.codec_type === 'audio'),
  };
};
const newer = (out, src) => fs.existsSync(out) && fs.statSync(out).mtimeMs > fs.statSync(src).mtimeMs;
const mb = (f) => (fs.statSync(f).size / 1024 / 1024).toFixed(1) + ' MB';

const jobs = [];
for (const project of fs.readdirSync(SRC)) {
  const dir = path.join(SRC, project);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const file of fs.readdirSync(dir)) {
    const ext = path.extname(file).toLowerCase();
    if (!EXT.has(ext)) continue;
    const name = path.basename(file, path.extname(file));
    if (only && !name.includes(only)) continue;
    jobs.push({ project, name, src: path.join(dir, file), cfg: path.join(dir, `${name}.json`) });
  }
}
if (!jobs.length) {
  console.log('No videos found in media-src/<project>/. Nothing to do.');
  process.exit(0);
}

for (const j of jobs) {
  const info = probe(j.src);
  const cfg = fs.existsSync(j.cfg) ? JSON.parse(fs.readFileSync(j.cfg, 'utf8')) : {};
  const len = Math.min(cfg.previewLength ?? 8, Math.max(1, info.duration));
  const start =
    cfg.previewStart ?? Math.max(0, Math.min(info.duration - len, Math.round(info.duration * 0.25 * 10) / 10));

  fs.mkdirSync(path.join(OUT_VIDEO, j.project), { recursive: true });
  fs.mkdirSync(path.join(OUT_IMAGE, j.project), { recursive: true });
  const full = path.join(OUT_VIDEO, j.project, `${j.name}.mp4`);
  const prev = path.join(OUT_VIDEO, j.project, `${j.name}-preview.mp4`);
  const poster = path.join(OUT_IMAGE, j.project, `${j.name}.jpg`);

  console.log(`\n▶ ${j.project}/${j.name}  (${info.width}×${info.height}, ${info.duration.toFixed(1)} s)`);

  if (flag('force') || !newer(full, j.src)) {
    run([
      '-i', j.src,
      '-vf', "scale='min(1920,iw)':-2:flags=lanczos",
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
      ...(info.audio ? ['-c:a', 'aac', '-b:a', '128k', '-ac', '2'] : ['-an']),
      '-movflags', '+faststart',
      full,
    ]);
  }
  console.log(`  full     ${path.relative(ROOT, full)}  ${mb(full)}`);

  if (flag('force') || !newer(prev, j.src)) {
    const fade = Math.min(0.3, len / 4);
    run([
      '-ss', String(start), '-t', String(len), '-i', j.src,
      '-vf', `scale='min(1280,iw)':-2:flags=lanczos,fps=30,fade=t=in:st=0:d=${fade},fade=t=out:st=${(len - fade).toFixed(2)}:d=${fade}`,
      '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      prev,
    ]);
  }
  console.log(`  preview  ${path.relative(ROOT, prev)}  ${mb(prev)}  (from ${start}s, ${len}s)`);

  if (flag('posters') || !fs.existsSync(poster)) {
    // Pick a representative frame from the preview window (skips fades / black frames).
    run([
      '-ss', String(start + Math.min(1, len / 4)), '-t', String(Math.max(1, len - 1)), '-i', j.src,
      '-vf', "thumbnail=60,scale='min(2560,iw)':-2:flags=lanczos",
      '-frames:v', '1', '-q:v', '2',
      poster,
    ]);
    console.log(`  poster   ${path.relative(ROOT, poster)}  ${mb(poster)}`);
  }

  if (fs.statSync(full).size > 50 * 1024 * 1024) {
    console.warn('  ! full video is over 50 MB — GitHub warns at 50 MB and rejects 100 MB. Consider a shorter cut.');
  }
}
console.log('\nDone. Remove `interim: true` from entries whose posters you replaced.');
