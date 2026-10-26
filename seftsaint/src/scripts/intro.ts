/**
 * Numbers that count up: the facts under the hero and the partner numbers.
 *  - during the first-visit intro, the hero facts count up on cue (data-count-delay, ms)
 *  - anywhere else, a number counts up once when it scrolls into view
 *  - numbers already on screen at load (without the intro) are left alone
 *  - the real value is always in the page for screen readers (a visually-hidden copy)
 * The intro itself (classes on <html>) is driven by a tiny inline script in Base.astro.
 */
export {};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const DURATION = 700;

const parse = (text: string) => {
  const m = text.match(/^(\D*)([\d.,]+)(.*)$/);
  if (!m) return null;
  const digits = m[2].replace(/,/g, '');
  const value = Number.parseFloat(digits);
  if (!Number.isFinite(value)) return null;
  return { pre: m[1], value, dec: (digits.split('.')[1] ?? '').length, suf: m[3] };
};

const zero = (el: HTMLElement) => {
  const p = parse(el.dataset.count ?? '');
  if (p) el.textContent = `${p.pre}${(0).toFixed(p.dec)}${p.suf}`;
};

const run = (el: HTMLElement, delay = 0) => {
  const final = el.dataset.count ?? '';
  const p = parse(final);
  if (!p) return;
  window.setTimeout(() => {
    const t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / DURATION);
      const eased = 1 - Math.pow(1 - k, 3);
      el.textContent = k < 1 ? `${p.pre}${(p.value * eased).toFixed(p.dec)}${p.suf}` : final;
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, delay);
};

const counters = [...document.querySelectorAll<HTMLElement>('[data-count]')];
if (counters.length && !reduceMotion.matches) {
  const introOn = document.documentElement.classList.contains('intro');
  const io =
    'IntersectionObserver' in window
      ? new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              if (!e.isIntersecting) continue;
              io?.unobserve(e.target);
              run(e.target as HTMLElement);
            }
          },
          { threshold: 0.6 },
        )
      : null;

  for (const el of counters) {
    const r = el.getBoundingClientRect();
    const onScreen = r.top < window.innerHeight && r.bottom > 0;
    if (introOn && el.closest('[data-intro]')) {
      zero(el);
      run(el, Number(el.dataset.countDelay) || 0);
    } else if (!onScreen && io) {
      zero(el);
      io.observe(el);
    }
  }
  window.addEventListener('beforeprint', () => counters.forEach((el) => (el.textContent = el.dataset.count ?? '')));
}

/* ── First visit: "Loading world 000% → 100%" ─────────────────
 * Tied to the real thing: it creeps up while the hero footage loads (holding
 * short of 100%), and finishes once the intro opens the world. Then it fades,
 * and the scroll cue takes its place. Only exists during the intro.
 */
const loading = document.querySelector<HTMLElement>('[data-loading]');
const html = document.documentElement;
if (loading && html.classList.contains('intro') && !reduceMotion.matches) {
  const pct = loading.querySelector<HTMLElement>('[data-loading-pct]');
  const bar = loading.querySelector<HTMLElement>('[data-loading-bar]');
  const MIN = 1150; // never faster than this, so it reads
  const t0 = performance.now();
  let shown = 0;
  const tick = (now: number) => {
    if (!html.classList.contains('intro')) return; // intro over (or skipped for print)
    const k = (now - t0) / MIN;
    const target = html.classList.contains('intro-open') ? Math.min(1, k) : Math.min(0.88, k * 0.88);
    shown = Math.max(shown, target);
    const p = 1 - Math.pow(1 - shown, 2);
    if (pct) pct.textContent = `${String(Math.round(p * 100)).padStart(3, '0')}%`;
    bar?.style.setProperty('--p', p.toFixed(3));
    if (shown >= 1) {
      window.setTimeout(() => loading.classList.add('is-done'), 180);
      return;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
