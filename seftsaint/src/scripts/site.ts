/**
 * Client-side behaviour. Small on purpose:
 *  1. header state on scroll
 *  2. reveal-on-scroll (fade, 350ms)
 *  3. video handling — previews play only while visible, pause when
 *     scrolled away or the tab is hidden; nothing loads until needed.
 */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const saveData = Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);

/* ── 1. Header ─────────────────────────────────────────────── */
const header = document.querySelector<HTMLElement>('[data-header]');
if (header) {
  let ticking = false;
  const update = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
    ticking = false;
  };
  update();
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
}

/* ── 2. Reveal ─────────────────────────────────────────────── */
const revealEls = document.querySelectorAll<HTMLElement>('[data-reveal]');
if (revealEls.length) {
  if (!('IntersectionObserver' in window) || reduceMotion.matches) {
    revealEls.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.08 },
    );
    revealEls.forEach((el) => {
      // Anything already on screen at load appears immediately — no waiting.
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-in');
      else io.observe(el);
    });
    // Never leave content hidden when printing.
    window.addEventListener('beforeprint', () => revealEls.forEach((el) => el.classList.add('is-in')));
  }
}

/* ── 3. Video ──────────────────────────────────────────────── */
type State = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

interface Entry {
  root: HTMLElement;
  video: HTMLVideoElement;
  mode: 'preview' | 'player';
  visible: boolean;
  userPaused: boolean;
  started: boolean;
}

const entries: Entry[] = [];

function setState(e: Entry, s: State) {
  e.root.dataset.state = s;
  const btn = e.root.querySelector<HTMLButtonElement>('[data-toggle]');
  if (btn) {
    const label = s === 'playing' ? btn.dataset.labelPause : btn.dataset.labelPlay;
    if (label) btn.setAttribute('aria-label', label);
  }
}

function load(e: Entry) {
  if (e.video.src) return;
  const src = e.video.dataset.src;
  if (!src) return;
  e.video.src = src;
  e.video.load();
}

function play(e: Entry) {
  if (e.root.dataset.state === 'error') return; // a broken file is never retried
  load(e);
  if (e.root.dataset.state !== 'playing') setState(e, 'loading');
  e.video.play().catch(() => {
    // Autoplay can be refused (low-power mode etc.) — leave the poster up.
    if (e.root.dataset.state !== 'error') setState(e, e.started ? 'paused' : 'idle');
  });
}

function pause(e: Entry) {
  if (!e.video.paused) e.video.pause();
}

const canAutoplay = () => finePointer.matches && !reduceMotion.matches && !saveData;

document.querySelectorAll<HTMLElement>('[data-media]').forEach((root) => {
  const video = root.querySelector<HTMLVideoElement>('video');
  const mode = root.dataset.media as Entry['mode'];
  if (!video || (mode !== 'preview' && mode !== 'player')) return;

  const e: Entry = { root, video, mode, visible: false, userPaused: false, started: false };
  entries.push(e);

  video.addEventListener('playing', () => {
    e.started = true;
    setState(e, 'playing');
  });
  video.addEventListener('pause', () => {
    if (root.dataset.state !== 'error') setState(e, e.started ? 'paused' : 'idle');
  });
  video.addEventListener('error', () => setState(e, 'error'));
  // <source>-less videos report network errors on the element; also catch stalled 404s.
  video.addEventListener('emptied', () => {
    if (video.error) setState(e, 'error');
  });

  if (mode === 'preview') {
    root.querySelector('[data-toggle]')?.addEventListener('click', () => {
      if (root.dataset.state === 'playing' || root.dataset.state === 'loading') {
        e.userPaused = true;
        pause(e);
        setState(e, e.started ? 'paused' : 'idle');
      } else {
        e.userPaused = false;
        play(e);
      }
    });
  }

  if (mode === 'player') {
    root.querySelector('[data-play]')?.addEventListener('click', () => {
      // Only one demo plays at a time.
      entries.forEach((other) => other !== e && pause(other));
      video.controls = true;
      play(e);
      video.focus({ preventScroll: true });
    });
  }
});

if (entries.length && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (list) => {
      for (const item of list) {
        const e = entries.find((x) => x.root === item.target);
        if (!e) continue;
        e.visible = item.isIntersecting;
        if (e.mode === 'preview') {
          if (e.visible && !e.userPaused && canAutoplay() && !document.hidden) play(e);
          else pause(e);
        } else if (!e.visible) {
          pause(e); // demos stop when scrolled away
        }
      }
    },
    { threshold: 0.35 },
  );
  entries.forEach((e) => io.observe(e.root));
}

document.addEventListener('visibilitychange', () => {
  for (const e of entries) {
    if (document.hidden) pause(e);
    else if (e.mode === 'preview' && e.visible && !e.userPaused && canAutoplay()) play(e);
  }
});

reduceMotion.addEventListener?.('change', () => {
  if (reduceMotion.matches) entries.forEach((e) => e.mode === 'preview' && pause(e));
});
