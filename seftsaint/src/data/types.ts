/**
 * Shared content types. You normally don't need to edit this file —
 * edit projects.ts, updates.ts, site.ts and ui.ts instead.
 */

/** Status shown on a project. Labels live in ui.ts. */
export type Status = 'in-progress' | 'experiment' | 'paused' | 'released';

/**
 * One piece of media: an image, a video, or both (video + poster image).
 *
 * - `image`   is a path inside `src/assets/media/` → optimised automatically (AVIF/WebP, responsive sizes).
 * - `preview` is a path inside `public/media/`     → short muted loop (6–10 s) that plays on hover / in view.
 * - `video`   is a path inside `public/media/`     → the full demo, played on click (with sound, controls).
 *
 * `npm run media` creates all three from your original recordings — see README.
 *
 * If a file doesn't exist yet the site still builds: it falls back to the poster,
 * then to a quiet placeholder with a link to `sourceUrl`. Missing files are listed
 * in the terminal when you run `npm run dev` or `npm run build`.
 */
export interface MediaItem {
  /** e.g. 'forest-concept/cover.jpg' (inside src/assets/media/) */
  image?: string;
  /** Short muted loop, e.g. 'forest-concept/demo-preview.mp4' (inside public/media/) */
  preview?: string;
  /** Full video, e.g. 'forest-concept/demo.mp4' (inside public/media/) */
  video?: string;
  /** Describe what is visible — used by screen readers and when the image fails. */
  alt: string;
  caption?: string;
  /** Original post (X or elsewhere). Used as a fallback link when the video is missing. */
  sourceUrl?: string;
  /**
   * true = temporary frame grabbed from the original post.
   * Replace it with your own export, then set this to false (or remove it).
   * Only shown as a small badge while running `npm run dev`.
   */
  interim?: boolean;
  /** CSS aspect-ratio of the frame. Default '16 / 9'. */
  aspect?: string;
  /** CSS object-position for cropping, e.g. '40% 50%'. Default 'center'. */
  focus?: string;
  /**
   * Optional wide (≈2.4:1) still without game HUD, for the cinematic strip on the home page,
   * e.g. 'forest-concept/latest-wide.jpg' (inside src/assets/media/). Falls back to `image`.
   */
  wide?: string;
}

export interface ProjectSection {
  /** Used as the #anchor on the project page. */
  id: string;
  heading: string;
  paragraphs?: string[];
  list?: {
    ordered?: boolean;
    items: string[];
  };
  /** Small grey note under the section. */
  footnote?: string;
}

export interface Project {
  /** URL: /work/<slug>/ */
  slug: string;
  title: string;
  /** Shows a small "Working title" tag next to the title. */
  workingTitle?: boolean;
  /** One or two sentences. Shown on the home page and at the top of the project page. */
  summary: string;
  /** One sharp line for the home page (featured world). Falls back to `summary`. */
  oneLiner?: string;
  /** A few words next to the status on the home page, e.g. 'The hardware hit its limit'. */
  statusShort?: string;
  /** e.g. ['Game prototype', '3D'] — free text, add anything (film, tool, visual study…). */
  types: string[];
  status: Status;
  /** Short, honest explanation of the status (why it's paused, what's next…). */
  statusNote?: string;
  /** The featured project gets the big spread on the home page. Only one should be true. */
  featured?: boolean;
  /** Lower = earlier on the home page. Projects without `order` are sorted by latest activity. */
  order?: number;
  /** ISO dates, e.g. '2026-09-14'. `label` explains what the dates mean. */
  period?: { start: string; end?: string; label?: string };
  tools?: string[];
  ai?: string[];
  cover: MediaItem;
  /** Optional long-form sections. Only the ones you add are shown. */
  sections?: ProjectSection[];
  /** Extra images / videos shown on the project page. */
  gallery?: MediaItem[];
  links?: { label: string; url: string }[];
  /** true = hidden from the site (keep working on it locally). */
  draft?: boolean;
}

export interface Update {
  /** Unique id — also used as the #anchor on the project page. */
  id: string;
  /** ISO date-time with timezone, e.g. '2026-09-25T21:28:00+07:00'. Sorting uses this, not list order. */
  date: string;
  title: string;
  body: string[];
  /** One short line for the lab notes on the home page. Falls back to the first sentence of `body`. */
  excerpt?: string;
  /**
   * Public numbers from the original post (only real counts, copied from X).
   * The date they were read lives in site.ts → story.statsAsOf.
   */
  stats?: { views: number; likes: number };
  /** slug of the related project (optional). */
  project?: string;
  /** Short label used in the project's progress strip, e.g. 'Godot'. */
  label?: string;
  tools?: string[];
  media?: MediaItem;
  /** Link to the original post. */
  sourceUrl?: string;
}

export interface NowItem {
  label: string;
  text: string;
  href?: string;
}
