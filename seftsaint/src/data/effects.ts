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
   * First visit to the home page: the hero frame opens from a line of light, the headline
   * rises in, then the facts count up. Plays once per visit, never blocks the page,
   * skipped for reduced motion and when arriving on a #link.
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
  lensLight: true,
  /** Small mono labels briefly "decode" when you hover them. */
  decode: true,
  /** Thin reading-progress line under the header. */
  scrollProgress: true,
  /** The dot in the wordmark breathes slowly — a quiet "in progress" signal. */
  pulse: true,
} as const;

export type EffectName = keyof typeof effects;

/** Space-separated list of enabled effects, written to <html data-fx="…">. */
export const enabledEffects = (Object.keys(effects) as EffectName[]).filter((k) => effects[k]).join(' ');
