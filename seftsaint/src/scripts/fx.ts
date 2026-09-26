/**
 * Effects. Each one is switched on/off in src/data/effects.ts
 * (written to <html data-fx="…">) and respects reduced motion.
 * Nothing here is required for the site to work.
 */

const root = document.documentElement;
const fx = new Set((root.dataset.fx ?? '').split(/\s+/).filter(Boolean));
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
const motionOK = () => !reduce.matches;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const pad = (n: number) => String(n).padStart(2, '0');

/* ── Lens light ────────────────────────────────────────────── */
if (fx.has('lensLight') && fine.matches && motionOK()) {
  const lens = document.querySelector<HTMLElement>('.fx-lens');
  if (lens) {
    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    let raf = 0;
    let on = false;
    const tick = () => {
      x = lerp(x, tx, 0.12);
      y = lerp(y, ty, 0.12);
      lens.style.setProperty('--lx', `${x.toFixed(1)}px`);
      lens.style.setProperty('--ly', `${y.toFixed(1)}px`);
      raf = Math.abs(x - tx) + Math.abs(y - ty) > 0.5 ? requestAnimationFrame(tick) : 0;
    };
    window.addEventListener(
      'pointermove',
      (e) => {
        if (e.pointerType !== 'mouse') return;
        tx = e.clientX;
        ty = e.clientY;
        if (!on) {
          on = true;
          x = tx;
          y = ty;
          lens.classList.add('is-on');
        }
        if (!raf) raf = requestAnimationFrame(tick);
      },
      { passive: true },
    );
    root.addEventListener('mouseleave', () => {
      on = false;
      lens.classList.remove('is-on');
    });
  }
}

/* ── Window parallax ───────────────────────────────────────── */
if (fx.has('parallax') && fine.matches && motionOK()) {
  document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
    const frame = el.querySelector<HTMLElement>('.media__frame') ?? el;
    const s = { x: 0, y: 0, z: 1, tx: 0, ty: 0, tz: 1 };
    let raf = 0;
    const tick = () => {
      s.x = lerp(s.x, s.tx, 0.09);
      s.y = lerp(s.y, s.ty, 0.09);
      s.z = lerp(s.z, s.tz, 0.09);
      el.style.setProperty('--mx', `${s.x.toFixed(2)}px`);
      el.style.setProperty('--my', `${s.y.toFixed(2)}px`);
      el.style.setProperty('--ms', s.z.toFixed(4));
      const moving = Math.abs(s.x - s.tx) + Math.abs(s.y - s.ty) + Math.abs(s.z - s.tz) * 100 > 0.05;
      raf = moving ? requestAnimationFrame(tick) : 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    frame.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = frame.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
      s.tx = -nx * 12;
      s.ty = -ny * 8;
      s.tz = 1.05;
      start();
    });
    frame.addEventListener('pointerleave', () => {
      s.tx = 0;
      s.ty = 0;
      s.tz = 1;
      start();
    });
  });
}

/* ── Hero: footage drifts slower than the page (scroll parallax) ── */
if (fx.has('parallax') && motionOK()) {
  const layer = document.querySelector<HTMLElement>('[data-hero-parallax]');
  const hero = layer?.closest<HTMLElement>('.hero');
  if (layer && hero) {
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = Math.min(window.scrollY, hero.offsetHeight);
      layer.style.transform = `translate3d(0, ${(y * 0.22).toFixed(1)}px, 0)`;
    };
    window.addEventListener(
      'scroll',
      () => {
        if (!raf && window.scrollY < hero.offsetHeight * 1.2) raf = requestAnimationFrame(update);
      },
      { passive: true },
    );
    update();
  }
}

/* ── Evolution viewer ──────────────────────────────────────── */
if (fx.has('evolution')) {
  document.querySelectorAll<HTMLElement>('[data-evo]').forEach((evo) => {
    const pics = [...evo.querySelectorAll<HTMLElement>('[data-evo-pic]')];
    const segs = [...evo.querySelectorAll<HTMLElement>('[data-evo-seg]')];
    const steps = [...evo.querySelectorAll<HTMLButtonElement>('[data-evo-step]')];
    const link = evo.querySelector<HTMLAnchorElement>('[data-evo-link]');
    const frame = evo.querySelector<HTMLElement>('.evo__frame');
    const dateEl = evo.querySelector<HTMLTimeElement>('[data-evo-date]');
    const labelEl = evo.querySelector<HTMLElement>('[data-evo-label]');
    const countEl = evo.querySelector<HTMLElement>('[data-evo-count]');
    const syncs = [...document.querySelectorAll<HTMLElement>('[data-evo-sync]')];
    const playBtn = evo.querySelector<HTMLButtonElement>('[data-evo-play]');
    const xLink = evo.querySelector<HTMLAnchorElement>('[data-evo-x]');
    const n = pics.length;
    const def = Number(evo.dataset.default ?? n - 1);
    if (!link || !frame || n < 2) return;

    let current = def;
    let pinned = def; // where it returns to after hovering

    const set = (i: number) => {
      i = clamp(i, 0, n - 1);
      if (i === current) return;
      current = i;
      const d = pics[i].dataset;
      pics.forEach((p, k) => p.classList.toggle('is-active', k === i));
      segs.forEach((sg, k) => sg.classList.toggle('is-active', k === i));
      steps.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
      if (dateEl) {
        dateEl.textContent = d.date ?? '';
        if (d.iso) dateEl.dateTime = d.iso;
      }
      if (labelEl) labelEl.textContent = d.label ?? '';
      if (countEl) countEl.textContent = `${pad(i + 1)} / ${pad(n)}`;
      link.href = `${link.dataset.base ?? ''}#${d.id ?? ''}`;
      if (playBtn) {
        if (d.video) {
          playBtn.dataset.playSrc = d.video;
          playBtn.dataset.playPoster = d.poster ?? '';
          playBtn.dataset.playTitle = d.title ?? '';
          playBtn.dataset.playMeta = d.meta ?? '';
          playBtn.dataset.playPost = d.post ?? '';
        } else {
          delete playBtn.dataset.playSrc;
        }
        playBtn.hidden = !d.video;
      }
      if (xLink) {
        if (d.post) xLink.href = d.post;
        xLink.hidden = !!d.video || !d.post;
      }
      link.setAttribute('aria-label', `${d.title ?? ''} — ${evo.dataset.project ?? ''}`);
      syncs.forEach((a) => a.classList.toggle('is-synced', Number(a.dataset.evoSync) === i && i !== def));
    };

    // Mouse: scrub by position — left is the first stage, right the latest.
    frame.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = frame.getBoundingClientRect();
      set(Math.floor(((e.clientX - r.left) / r.width) * n));
    });
    frame.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse') set(pinned);
    });

    // Buttons (touch + keyboard)
    steps.forEach((b) =>
      b.addEventListener('click', () => {
        pinned = Number(b.dataset.evoStep);
        set(pinned);
      }),
    );

    // Hovering a small frame previews it in the big one.
    let leaveTimer = 0;
    syncs.forEach((a) => {
      const i = Number(a.dataset.evoSync);
      if (Number.isNaN(i)) return;
      const enter = () => {
        window.clearTimeout(leaveTimer);
        set(i);
      };
      const leave = () => {
        leaveTimer = window.setTimeout(() => set(pinned), 120);
      };
      a.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && enter());
      a.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && leave());
      a.addEventListener('focus', enter);
      a.addEventListener('blur', leave);
    });
  });
}

/* ── Then & now compare ────────────────────────────────────── */
if (fx.has('compare')) {
  document.querySelectorAll<HTMLElement>('[data-compare]').forEach((cmp) => {
    const frame = cmp.querySelector<HTMLElement>('[data-compare-frame]');
    const range = cmp.querySelector<HTMLInputElement>('[data-compare-range]');
    if (!frame || !range) return;

    let pos = 50;
    let target = 50;
    let raf = 0;
    let dragging = false;

    const apply = (v: number) => {
      cmp.style.setProperty('--pos', `${v.toFixed(2)}%`);
      cmp.dataset.edge = v < 22 ? 'left' : v > 78 ? 'right' : '';
    };
    const tick = () => {
      pos = lerp(pos, target, 0.22);
      if (Math.abs(pos - target) < 0.05) pos = target;
      apply(pos);
      raf = pos !== target ? requestAnimationFrame(tick) : 0;
    };
    const moveTo = (v: number, smooth: boolean) => {
      target = clamp(v, 0, 100);
      range.value = String(Math.round(target));
      if (!smooth || !motionOK()) {
        pos = target;
        apply(pos);
        return;
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const fromEvent = (e: PointerEvent) => {
      const r = frame.getBoundingClientRect();
      return ((e.clientX - r.left) / r.width) * 100;
    };

    frame.addEventListener('pointerdown', (e) => {
      dragging = true;
      cmp.dataset.dragging = '';
      frame.setPointerCapture(e.pointerId);
      moveTo(fromEvent(e), e.pointerType === 'mouse');
    });
    frame.addEventListener('pointermove', (e) => {
      if (dragging) moveTo(fromEvent(e), false);
      else if (e.pointerType === 'mouse' && fine.matches) moveTo(fromEvent(e), true);
    });
    const end = () => {
      dragging = false;
      delete cmp.dataset.dragging;
    };
    frame.addEventListener('pointerup', end);
    frame.addEventListener('pointercancel', end);
    range.addEventListener('input', () => moveTo(Number(range.value), false));
  });
}

/* ── Cursor preview on list rows ───────────────────────────── */
if (fx.has('hoverPreview') && fine.matches && motionOK()) {
  const rows = [...document.querySelectorAll<HTMLElement>('[data-preview-src]')].filter((r) => r.dataset.previewSrc);
  if (rows.length) {
    const box = document.createElement('div');
    box.className = 'fx-preview';
    box.setAttribute('aria-hidden', 'true');
    const inner = document.createElement('div');
    inner.className = 'fx-preview__inner';
    const img = document.createElement('img');
    img.alt = '';
    img.decoding = 'async';
    inner.append(img);
    box.append(inner);
    document.body.append(box);

    const W = 260;
    const H = (W * 9) / 16;
    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;
    let raf = 0;
    let visible = false;
    let hideTimer = 0;

    const place = () => {
      box.style.setProperty('--fx', `${x.toFixed(1)}px`);
      box.style.setProperty('--fy', `${y.toFixed(1)}px`);
    };
    const tick = () => {
      x = lerp(x, tx, 0.2);
      y = lerp(y, ty, 0.2);
      place();
      raf = Math.abs(x - tx) + Math.abs(y - ty) > 0.3 ? requestAnimationFrame(tick) : 0;
    };
    const target = (e: PointerEvent) => {
      const gap = 28;
      tx = e.clientX + gap + W > window.innerWidth - 16 ? e.clientX - gap - W : e.clientX + gap;
      ty = clamp(e.clientY - H / 2, 12, window.innerHeight - H - 12);
    };

    const show = (row: HTMLElement, e: PointerEvent) => {
      window.clearTimeout(hideTimer);
      if (img.getAttribute('src') !== row.dataset.previewSrc) img.src = row.dataset.previewSrc!;
      target(e);
      if (!visible) {
        x = tx;
        y = ty;
        place();
      }
      visible = true;
      box.classList.add('is-on');
    };

    rows.forEach((row) => {
      row.addEventListener('pointerenter', (e) => {
        if (e.pointerType === 'mouse') show(row, e);
      });
      row.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        if (!visible) return show(row, e); // came back after a scroll
        target(e);
        if (!raf) raf = requestAnimationFrame(tick);
      });
      row.addEventListener('pointerleave', () => {
        hideTimer = window.setTimeout(() => {
          visible = false;
          box.classList.remove('is-on');
        }, 60);
      });
    });
    window.addEventListener(
      'scroll',
      () => {
        if (visible) {
          visible = false;
          box.classList.remove('is-on');
        }
      },
      { passive: true },
    );
  }
}

/* ── Decode on hover ───────────────────────────────────────── */
if (fx.has('decode') && motionOK()) {
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#+*<>';
  const KEEP = /[\s·&/—–-]/;
  const groups = new Map<Element, Array<() => void>>();

  document.querySelectorAll<HTMLElement>('[data-decode]').forEach((el) => {
    const text = el.textContent ?? '';
    if (!text.trim()) return;
    // Visible copy is decorative; a visually-hidden copy keeps the real text for screen readers.
    el.textContent = '';
    const vis = document.createElement('span');
    vis.className = 'fx-decode-vis';
    vis.setAttribute('aria-hidden', 'true');
    vis.textContent = text;
    const sr = document.createElement('span');
    sr.className = 'visually-hidden';
    sr.textContent = text;
    el.append(vis, sr);

    let running = false;
    const run = () => {
      if (running) return;
      running = true;
      const start = performance.now();
      const D = 320;
      let last = 0;
      const frame = (t: number) => {
        const p = Math.min(1, (t - start) / D);
        if (t - last > 34 || p === 1) {
          last = t;
          const revealed = Math.floor(p * text.length);
          vis.textContent = [...text]
            .map((c, i) => (i < revealed || KEEP.test(c) ? c : CHARS[(Math.random() * CHARS.length) | 0]))
            .join('');
        }
        if (p < 1) requestAnimationFrame(frame);
        else {
          vis.textContent = text;
          running = false;
        }
      };
      requestAnimationFrame(frame);
    };

    const area = el.closest('[data-decode-area]') ?? el;
    if (!groups.has(area)) groups.set(area, []);
    groups.get(area)!.push(run);
  });

  groups.forEach((runs, area) => {
    area.addEventListener('pointerenter', (e) => {
      if ((e as PointerEvent).pointerType === 'mouse') runs.forEach((r) => r());
    });
    area.addEventListener('focusin', () => runs.forEach((r) => r()));
  });
}

/* ── Reading progress ──────────────────────────────────────── */
if (fx.has('scrollProgress')) {
  const bar = document.querySelector<HTMLElement>('[data-progress]');
  if (bar) {
    let ticking = false;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.classList.toggle('is-on', max > window.innerHeight * 1.2);
      bar.style.setProperty('--progress', max > 0 ? String(clamp(window.scrollY / max, 0, 1)) : '0');
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
    window.addEventListener('resize', update, { passive: true });
  }
}

/* ── For the curious ───────────────────────────────────────── */
console.log(
  '%c● seftsaint%c  worlds in progress\n%cBuilt with Astro and a lot of AI tokens → https://x.com/seftsaint',
  'color:#c6dcb2;font:600 13px ui-monospace,monospace',
  'color:#ece9e2;font:13px ui-monospace,monospace',
  'color:#8a8883;font:12px ui-monospace,monospace',
);
