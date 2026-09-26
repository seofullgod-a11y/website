/**
 * Partner invitation — everything here is optional polish; the site works without it.
 *  1. Corner card (PartnerNudge.astro): appears once the visitor has seen the work
 *  2. "Copy email"
 *  3. "Back the next world" on video end screens closes the player first
 */
export {}; // module scope — keeps these names separate from site.ts


// Storage can be blocked (private mode, strict settings) — never let that break the page.
const safe = {
  get(store: 'local' | 'session', key: string): string | null {
    try {
      return (store === 'local' ? localStorage : sessionStorage).getItem(key);
    } catch {
      return null;
    }
  },
  set(store: 'local' | 'session', key: string, value: string) {
    try {
      (store === 'local' ? localStorage : sessionStorage).setItem(key, value);
    } catch {
      /* ignore */
    }
  },
};

const SNOOZE_KEY = 'seftsaint:partner-nudge-snooze-until';
const SEEN_KEY = 'seftsaint:partner-seen';
const lightbox = document.querySelector<HTMLDialogElement>('[data-lightbox]');

/* ── 1. Corner card ────────────────────────────────────────── */
const nudge = document.querySelector<HTMLElement>('[data-nudge]');
if (nudge) {
  const snoozeDays = Number(nudge.dataset.snooze) || 7;
  const snoozed = Number(safe.get('local', SNOOZE_KEY) || 0) > Date.now();
  let seen = safe.get('session', SEEN_KEY) === '1';
  let shown = false;
  let partnerOnScreen = false;
  let pending = 0;

  const blocked = () => snoozed || seen;

  const show = (delay = 500) => {
    if (blocked() || shown) return;
    window.clearTimeout(pending);
    pending = window.setTimeout(() => {
      if (blocked() || shown || lightbox?.open) return;
      shown = true;
      nudge.hidden = false;
      nudge.classList.toggle('is-away', partnerOnScreen);
      // two frames so the entry transition runs
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          nudge.classList.add('is-on');
          // "New quest" decodes as the card arrives (fx.ts → decode).
          window.setTimeout(() => nudge.dispatchEvent(new CustomEvent('decode:play')), 160);
        }),
      );
    }, delay);
  };

  const hide = () => {
    window.clearTimeout(pending);
    nudge.classList.remove('is-on');
    window.setTimeout(() => {
      if (!nudge.classList.contains('is-on')) nudge.hidden = true;
    }, 360);
  };

  const markSeen = () => {
    seen = true;
    safe.set('session', SEEN_KEY, '1');
  };

  nudge.querySelector('[data-nudge-close]')?.addEventListener('click', () => {
    safe.set('local', SNOOZE_KEY, String(Date.now() + snoozeDays * 864e5));
    hide();
  });
  nudge.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') nudge.querySelector<HTMLButtonElement>('[data-nudge-close]')?.click();
  });
  nudge.querySelectorAll('[data-nudge-cta]').forEach((a) =>
    a.addEventListener('click', () => {
      markSeen();
      hide();
    }),
  );

  if ('IntersectionObserver' in window) {
    // Seen the work → invite.
    const triggerIO = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          show();
          triggerIO.disconnect();
        }
      },
      { rootMargin: '0px 0px -35% 0px' },
    );
    document.querySelectorAll('[data-nudge-trigger]').forEach((el) => triggerIO.observe(el));

    // The partner section is on screen → step aside; once properly seen, stay away this visit.
    const section = document.getElementById('partner');
    if (section) {
      // (kept alive for the whole visit)
      const sectionIO = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            partnerOnScreen = e.isIntersecting;
            nudge.classList.toggle('is-away', partnerOnScreen);
            const bigEnough = e.intersectionRatio >= 0.4 || e.intersectionRect.height >= window.innerHeight * 0.6;
            if (e.isIntersecting && bigEnough) markSeen();
            else if (!e.isIntersecting && seen && shown) hide();
          }
        },
        { threshold: [0, 0.2, 0.4, 0.6] },
      );
      sectionIO.observe(section);
    }
  }

  // Watched a demo (≥ 6 s, or to the end) → invite right after the player closes.
  const lbVideo = lightbox?.querySelector<HTMLVideoElement>('[data-lb-video]');
  let watched = 0;
  lbVideo?.addEventListener('timeupdate', () => {
    if (lbVideo.getAttribute('src')) watched = Math.max(watched, lbVideo.currentTime);
  });
  lbVideo?.addEventListener('ended', () => (watched = Infinity));
  lightbox?.addEventListener('close', () => {
    if (watched >= 6) show(700);
    watched = 0;
  });
  // Inline demo on a project page played to the end → invite.
  document.querySelectorAll<HTMLVideoElement>('.media__full').forEach((v) => v.addEventListener('ended', () => show(900)));
}

/* ── 2. Copy email ─────────────────────────────────────────── */
document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
  const label = btn.querySelector<HTMLElement>('[data-copy-label]');
  const status = btn.parentElement?.querySelector<HTMLElement>('[data-copy-status]');
  const idle = label?.textContent ?? '';
  let timer = 0;
  btn.hidden = false; // shown only when JS can actually copy
  btn.addEventListener('click', async () => {
    const text = btn.dataset.copy ?? '';
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.append(ta);
      ta.select();
      try {
        ok = (document as unknown as { execCommand(cmd: string): boolean }).execCommand('copy'); // old browsers
      } catch {
        ok = false;
      }
      ta.remove();
    }
    if (!ok) return;
    btn.dataset.state = 'copied';
    if (label) label.textContent = btn.dataset.copiedLabel ?? idle;
    if (status) status.textContent = btn.dataset.announce ?? '';
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      delete btn.dataset.state;
      if (label) label.textContent = idle;
      if (status) status.textContent = '';
    }, 2200);
  });
});

/* ── 3. End-screen "Back the next world" inside the player ── */
lightbox?.querySelector('[data-lb-partner]')?.addEventListener('click', () => {
  // On the home page this is a same-page jump — close the player so the page can scroll.
  if (document.getElementById('partner')) lightbox.close();
});
