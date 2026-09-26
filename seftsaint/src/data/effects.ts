/**
 * ─────────────────────────────────────────────────────────────
 *  EFFECTS — switch any of them off with `false`.
 *
 *  All effects are:
 *   · off for visitors who ask for reduced motion
 *   · pointer-only where it makes sense (no hover tricks on touch)
 *   · progressive — the site works the same without them
 * ─────────────────────────────────────────────────────────────
 */
export const effects = {
  /**
   * First visit to the home page: the footage fades up out of the dark and settles, the
   * headline rises in line by line, a horizon line draws across. Plays once per visit,
   * never blocks the page, skipped for reduced motion and when arriving on a #link.
   */
  intro: true,
  /** Featured project: move across the big frame to scrub through its stages (Godot → … → latest). */
  evolution: true,
  /** Project page: drag a divider to compare the first and the latest frame. */
  compare: true,
  /** Progress lists: a small frame follows the cursor while hovering a row. */
  hoverPreview: true,
  /** Hero and cover frames: the image shifts slightly with the cursor, like looking through a window. */
  parallax: true,
  /** A very soft light follows the cursor over the dark background. */
  lensLight: false,
  /**
   * Labels "decode": the letters shuffle, then settle back into the real words.
   * Plays on hover (mouse), on tap (phones), on keyboard focus, and once for each
   * section label as it scrolls into view. Screen readers always get the real text.
   */
  decode: true,
  /**
   * Frames render in tile by tile, like a 3D render — the featured strip and the
   * story thumbnails, once each as they arrive (and again, quickly, when you switch builds).
   */
  render: true,
  /** Featured world: a level-select track under the strip (01 Godot → 04 Last update → next world, locked). */
  levels: true,
  /** First-visit intro: a small "Loading world 000% → 100%" counter at the bottom of the hero. */
  loading: true,
  /** Home, wide screens: the header shows which section you're in ("02 / 05 — Featured world"). */
  hud: true,
  /** Thin reading-progress line under the header. */
  scrollProgress: true,
  /** The dot in the wordmark breathes slowly — a quiet "in progress" signal. */
  pulse: true,
} as const;

export type EffectName = keyof typeof effects;

/** Space-separated list of enabled effects, written to <html data-fx="…">. */
export const enabledEffects = (Object.keys(effects) as EffectName[]).filter((k) => effects[k]).join(' ');
