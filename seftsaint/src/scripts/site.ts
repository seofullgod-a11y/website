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
/*
 * Three kinds of playback:
 *  - loop  (data-loop="view")  : short muted preview, plays while visible (mouse devices only)
 *  - loop  (data-loop="hover") : short muted preview, plays while hovered
 *  - full  (data-full)         : the full demo, played inline on click, with sound + controls
 * plus the player overlay (<dialog data-lightbox>) opened by any [data-play-src] button.
 * Nothing downloads until it's needed.
 */
type State = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

const canAutoplay = () => finePointer.matches && !reduceMotion.matches && !saveData;

class Clip {
  started = false;
  visible = false;
  userPaused = false;
  constructor(
    public root: HTMLElement,
    public video: HTMLVideoElement,
    public key: 'loop' | 'full',
  ) {
    video.addEventListener('playing', () => {
      this.started = true;
      this.set('playing');
    });
    video.addEventListener('pause', () => {
      if (this.state === 'error' || this.state === 'ended') return;
      const hoverLoop = key === 'loop' && root.dataset.loop === 'hover';
      this.set(hoverLoop || !this.started ? 'idle' : 'paused');
    });
    video.addEventListener('ended', () => key === 'full' && this.set('ended'));
    video.addEventListener('error', () => this.set('error'));
    video.addEventListener('emptied', () => video.error && this.set('error'));
  }
  get state(): State {
    return ((this.key === 'loop' ? this.root.dataset.loopState : this.root.dataset.fullState) ?? 'idle') as State;
  }
  set(s: State) {
    if (this.key === 'loop') this.root.dataset.loopState = s;
    else this.root.dataset.fullState = s;
    if (this.key === 'loop') {
      const btn = this.root.querySelector<HTMLButtonElement>('[data-toggle]');
      const label = s === 'playing' ? btn?.dataset.labelPause : btn?.dataset.labelPlay;
      if (btn && label) btn.setAttribute('aria-label', label);
    } else {
      const end = this.root.querySelector<HTMLElement>('[data-end]');
      if (end) end.hidden = s !== 'ended';
    }
  }
  load() {
    if (this.video.getAttribute('src') || !this.video.dataset.src) return;
    this.video.src = this.video.dataset.src;
    this.video.load();
  }
  play() {
    if (this.state === 'error') return; // a broken file is never retried
    this.load();
    if (this.state !== 'playing') this.set('loading');
    this.video.play().catch(() => {
      if (this.state !== 'error') this.set(this.started ? 'paused' : 'idle');
    });
  }
  pause() {
    if (!this.video.paused) this.video.pause();
  }
}

const loops: Clip[] = [];
const fulls: Clip[] = [];
const lightboxVideo = document.querySelector<HTMLVideoElement>('[data-lb-video]');

/** Stop everything that makes sound (and the loops, when the overlay opens). */
function pauseAll({ loopsToo = false } = {}) {
  fulls.forEach((c) => c.pause());
  if (loopsToo) loops.forEach((c) => c.pause());
  if (lightboxVideo && !lightboxVideo.paused) lightboxVideo.pause();
}

function resumeViewLoops() {
  loops.forEach((c) => {
    if (c.root.dataset.loop === 'view' && c.visible && !c.userPaused && canAutoplay() && !document.hidden) c.play();
  });
}

document.querySelectorAll<HTMLElement>('[data-loop]').forEach((root) => {
  const video = root.querySelector<HTMLVideoElement>('.media__loop');
  if (!video) return;
  const c = new Clip(root, video, 'loop');
  loops.push(c);

  if (root.dataset.loop === 'view') {
    root.querySelector('[data-toggle]')?.addEventListener('click', () => {
      if (c.state === 'playing' || c.state === 'loading') {
        c.userPaused = true;
        c.pause();
      } else {
        c.userPaused = false;
        c.play();
      }
    });
  } else {
    // Hover preview — mouse only, and never while the full video is showing.
    const area = root.closest<HTMLElement>('a, [data-hover-area]') ?? root;
    area.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse' || !canAutoplay()) return;
      const full = root.dataset.fullState;
      if (full && full !== 'idle') return;
      c.play();
    });
    area.addEventListener('pointerleave', () => c.pause());
  }
});

document.querySelectorAll<HTMLElement>('[data-full]').forEach((root) => {
  const video = root.querySelector<HTMLVideoElement>('.media__full');
  if (!video) return;
  const c = new Clip(root, video, 'full');
  fulls.push(c);
  const loop = loops.find((l) => l.root === root);

  root.querySelector('[data-play-inline]')?.addEventListener('click', () => {
    pauseAll();
    loop?.pause();
    video.controls = true;
    video.muted = false; // the visitor asked for it — sound on
    c.play();
    video.focus({ preventScroll: true });
  });
  root.querySelector('[data-replay]')?.addEventListener('click', () => {
    video.currentTime = 0;
    c.play();
    video.focus({ preventScroll: true });
  });
});

if ('IntersectionObserver' in window && (loops.length || fulls.length)) {
  const io = new IntersectionObserver(
    (list) => {
      for (const item of list) {
        const inView = item.isIntersecting;
        for (const c of [...loops, ...fulls]) {
          if (c.root !== item.target) continue;
          c.visible = inView;
          if (c.key === 'loop' && c.root.dataset.loop === 'view') {
            if (inView && !c.userPaused && canAutoplay() && !document.hidden) c.play();
            else c.pause();
          } else if (!inView) {
            c.pause(); // anything scrolled away stops
          }
        }
      }
    },
    { threshold: 0.35 },
  );
  new Set([...loops, ...fulls].map((c) => c.root)).forEach((r) => io.observe(r));
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseAll({ loopsToo: true });
  else resumeViewLoops();
});

reduceMotion.addEventListener?.('change', () => {
  if (reduceMotion.matches) loops.forEach((c) => c.pause());
});

/* ── 4. Player overlay ─────────────────────────────────────── */
const dialog = document.querySelector<HTMLDialogElement>('[data-lightbox]');
if (dialog && lightboxVideo) {
  const q = <T extends Element>(sel: string) => dialog.querySelector<T>(sel);
  const titleEl = q<HTMLElement>('[data-lb-title]');
  const metaEl = q<HTMLElement>('[data-lb-meta]');
  const endEl = q<HTMLElement>('[data-lb-end]');
  const errEl = q<HTMLAnchorElement>('[data-lb-error]');
  const footEl = q<HTMLElement>('[data-lb-foot]');
  const postLinks = [...dialog.querySelectorAll<HTMLAnchorElement>('[data-lb-post]')];
  const v = lightboxVideo;

  const reset = () => {
    if (endEl) endEl.hidden = true;
    if (errEl) errEl.hidden = true;
  };

  const open = (btn: HTMLElement) => {
    const d = btn.dataset;
    if (!d.playSrc) return;
    if (typeof dialog.showModal !== 'function') {
      window.open(d.playPost || d.playSrc, '_blank', 'noopener');
      return;
    }
    pauseAll({ loopsToo: true });
    reset();
    if (titleEl) titleEl.textContent = d.playTitle ?? '';
    if (metaEl) {
      metaEl.textContent = d.playMeta ?? '';
      metaEl.hidden = !d.playMeta;
    }
    const post = d.playPost ?? '';
    postLinks.forEach((a) => {
      a.href = post || '#';
      a.hidden = !post;
    });
    if (errEl) errEl.href = post || d.playSrc;
    if (footEl) footEl.hidden = !post;
    v.poster = d.playPoster ?? '';
    v.src = d.playSrc;
    v.muted = false;
    dialog.showModal();
    v.play().catch(() => {
      /* the visitor can press play in the controls */
    });
  };

  document.addEventListener('click', (e) => {
    const btn = (e.target as Element | null)?.closest<HTMLElement>('[data-play-src]');
    if (!btn) return;
    e.preventDefault();
    open(btn);
  });

  v.addEventListener('ended', () => {
    if (endEl) endEl.hidden = false;
  });
  v.addEventListener('playing', reset);
  v.addEventListener('error', () => {
    if (v.getAttribute('src') && errEl) errEl.hidden = false;
  });
  q('[data-lb-replay]')?.addEventListener('click', () => {
    reset();
    v.currentTime = 0;
    v.play().catch(() => {});
  });
  q('[data-lb-close]')?.addEventListener('click', () => dialog.close());
  // Click on the dimmed backdrop closes it.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    v.pause();
    v.removeAttribute('src');
    v.load();
    resumeViewLoops();
  });
}
