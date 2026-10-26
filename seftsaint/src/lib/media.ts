import fs from 'node:fs';
import path from 'node:path';
import type { ImageMetadata } from 'astro';
import type { MediaItem } from '../data/types';

/**
 * Resolves the string paths used in projects.ts / updates.ts into real files.
 * Runs at build time only (never shipped to the browser).
 */

const imageModules = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/media/**/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG}',
  { eager: true },
);

const warned = new Set<string>();
function warnOnce(key: string, message: string) {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`\x1b[33m[media]\x1b[0m ${message}`);
}

const clean = (p: string) => p.replace(/^\/+/, '').replace(/^(src\/assets\/media|public\/media|media)\//, '');

export function resolveImage(p?: string): ImageMetadata | undefined {
  if (!p) return undefined;
  const key = `/src/assets/media/${clean(p)}`;
  const mod = imageModules[key];
  if (!mod) warnOnce(key, `missing image → src/assets/media/${clean(p)}`);
  return mod?.default;
}

export function resolveVideo(p?: string): string | undefined {
  if (!p) return undefined;
  const rel = clean(p);
  const file = path.join(process.cwd(), 'public', 'media', rel);
  if (!fs.existsSync(file)) {
    warnOnce(file, `missing video → public/media/${rel}  (falls back to poster / link)`);
    return undefined;
  }
  return `/media/${rel}`;
}

export interface ResolvedMedia {
  image?: ImageMetadata;
  preview?: string;
  video?: string;
  /** Declared in data but file not found — show the pending state in dev. */
  missingImage?: string;
  missingVideo?: string;
  missingPreview?: string;
  item: MediaItem;
}

export function resolveMedia(item: MediaItem): ResolvedMedia {
  const image = resolveImage(item.image);
  const preview = resolveVideo(item.preview);
  const video = resolveVideo(item.video);
  return {
    image,
    preview,
    video,
    missingImage: item.image && !image ? `src/assets/media/${clean(item.image)}` : undefined,
    missingVideo: item.video && !video ? `public/media/${clean(item.video)}` : undefined,
    missingPreview: item.preview && !preview ? `public/media/${clean(item.preview)}` : undefined,
    item,
  };
}
