/**
 * Text scramble ("decode"): letters shuffle through random glyphs, then settle
 * left → right into the real text. Used by the hover/tap/reveal effect in fx.ts,
 * the section HUD in the header and the featured-world build caption.
 *
 * Case-aware (A→A-Z, a→a-z, 7→0-9), spaces and punctuation stay put, and the
 * element keeps its final width while scrambling so nothing around it jumps.
 */
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+<>/=';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const DIGIT = '0123456789';
const pick = (set: string) => set[(Math.random() * set.length) | 0];
const glyph = (c: string) =>
  /[A-Z]/.test(c) ? pick(UPPER) : /[a-z]/.test(c) ? pick(LOWER) : /[0-9]/.test(c) ? pick(DIGIT) : c;

const running = new WeakMap<HTMLElement, number>();

export const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Is an effect from src/data/effects.ts switched on? */
export const fxOn = (name: string) => (document.documentElement.dataset.fx ?? '').split(/\s+/).includes(name);

/**
 * Scramble `el` into `text` (defaults to its current text).
 * The element should contain text only.
 */
export function scramble(el: HTMLElement, text = el.textContent ?? '', { duration }: { duration?: number } = {}) {
  const prev = running.get(el);
  if (prev) {
    cancelAnimationFrame(prev);
    running.delete(el);
    el.style.display = el.style.whiteSpace = el.style.width = '';
  }
  // Settle on the real text first — that's what we measure, and what stays if motion is off.
  el.textContent = text;
  if (reduceMotion() || !text.trim()) return;

  // Lock the width on single-line text so neighbours don't jiggle.
  const singleLine = el.getClientRects().length <= 1;
  if (singleLine) {
    const w = el.getBoundingClientRect().width;
    el.style.display = 'inline-block';
    el.style.whiteSpace = 'nowrap';
    el.style.width = `${Math.ceil(w)}px`;
  }

  const chars = [...text];
  const D = duration ?? Math.min(650, Math.max(320, chars.length * 28));
  const start = performance.now();
  let last = 0;
  const frame = (t: number) => {
    const p = Math.min(1, (t - start) / D);
    if (t - last > 38 || p === 1) {
      last = t;
      const revealed = ((p * p + p) / 2) * chars.length; // starts slow, locks in quickly
      el.textContent = chars.map((c, i) => (i < revealed ? c : glyph(c))).join('');
    }
    if (p < 1) {
      running.set(el, requestAnimationFrame(frame));
    } else {
      el.textContent = text;
      running.delete(el);
      if (singleLine) el.style.display = el.style.whiteSpace = el.style.width = '';
    }
  };
  running.set(el, requestAnimationFrame(frame));
}
