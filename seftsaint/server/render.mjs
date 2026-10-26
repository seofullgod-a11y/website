/**
 * Devlog → HTML, rendered by the server at request time and dropped into the
 * static pages where they hold a marker (<!--devlog:…-->).
 * Styles: src/styles/devlog.css. Behaviour (loops, player, decode, render pass,
 * filter) comes from the site's normal scripts, which run on this HTML as usual.
 * Everything that came from a person is escaped here.
 */

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** '2026-09-27' → '27 Sep 2026' */
export const fmtDate = (ymd) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};
const dayNumber = (ymd) => Date.UTC(...ymd.split('-').map((n, i) => Number(n) - (i === 1 ? 1 : 0)));
const daysBetween = (a, b) => Math.round((dayNumber(b) - dayNumber(a)) / 86400000);
const fmtDuration = (s) => {
  if (!s || !Number.isFinite(s)) return '';
  const t = Math.max(1, Math.round(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
};
const pad = (n) => String(n).padStart(2, '0');

const ICON_PLAY = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 3.5v9l7-4.5z" fill="currentColor"/></svg>';

export function createRenderer(cfg) {
  const L = cfg.labels;
  const cats = new Map(cfg.categories.map((c) => [c.key, c]));
  const projects = new Map(cfg.projects.map((p) => [p.slug, p]));
  const catLabel = (key) => cats.get(key)?.label ?? key;
  const count = (n) => `${n} ${n === 1 ? L.updateOne : L.updateMany}`;

  /** Paragraphs from plain text (blank line = new paragraph, single newline = line break). */
  const paragraphs = (text) =>
    String(text || '')
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p class="dl-card__text">${esc(p).replace(/\n/g, '<br>')}</p>`)
      .join('');

  function card(e) {
    const m = e.media;
    // Upright phone clips and screenshots sit whole inside the frame instead of being cropped.
    const tall = m && m.w && m.h && m.h > m.w * 1.05 ? ' dl-card__media--tall' : '';
    const meta = `${fmtDate(e.date)} · ${catLabel(e.category)}`;
    let media = '';
    if (m && m.type === 'video' && m.clip) {
      const loop = m.preview
        ? `<video class="dl-card__video media__loop" data-src="${esc(m.preview)}" muted loop playsinline preload="none" disablepictureinpicture aria-hidden="true" tabindex="-1"></video>`
        : '';
      media = `
      <div class="dl-card__media${tall}"${m.preview ? ' data-loop="view" data-loop-state="idle"' : ''}>
        ${m.poster ? `<img class="dl-card__poster" src="${esc(m.poster)}" alt="${esc(m.alt || '')}" loading="lazy" decoding="async">` : ''}
        ${loop}
        <span class="render" data-render data-render-tile="56" aria-hidden="true"></span>
        <button type="button" class="dl-card__play" data-play-src="${esc(m.clip)}" data-play-poster="${esc(m.poster || '')}" data-play-title="${esc(e.title)}" data-play-meta="${esc(meta)}"${e.link ? ` data-play-post="${esc(e.link)}"` : ''} aria-haspopup="dialog" data-decode-area>
          <span class="dl-card__pill">${ICON_PLAY}<span data-decode>${esc(L.watch)}</span></span>
          <span class="visually-hidden">: ${esc(e.title)}</span>
        </button>
        ${m.duration ? `<span class="dl-card__dur mono" aria-hidden="true">${fmtDuration(m.duration)}</span>` : ''}
      </div>`;
    } else if (m && m.poster) {
      media = `
      <div class="dl-card__media dl-card__media--image${tall}">
        <img class="dl-card__poster" src="${esc(m.image || m.poster)}" alt="${esc(m.alt || '')}" loading="lazy" decoding="async">
        <span class="render" data-render data-render-tile="56" aria-hidden="true"></span>
      </div>`;
    }
    const link = e.link
      ? `<p class="dl-card__links"><a class="dl-card__link" href="${esc(e.link)}" target="_blank" rel="noopener" data-decode-area><span data-decode>${esc(L.onX)}</span> <span aria-hidden="true">↗</span><span class="visually-hidden"> (opens in a new tab)</span></a></p>`
      : '';
    return `
    <li class="dl-card${media ? '' : ' dl-card--text'}" id="u-${esc(e.id)}" data-cat="${esc(e.category)}" data-decode-area>
      ${media}
      <div class="dl-card__body">
        <p class="dl-card__cat"><span data-decode>${esc(catLabel(e.category))}</span></p>
        <h3 class="dl-card__title">${esc(e.title)}</h3>
        ${paragraphs(e.text)}
        ${link}
      </div>
    </li>`;
  }

  function dayHead(date, items, today) {
    const diff = daysBetween(date, today);
    const rel = diff === 0 ? L.today : diff === 1 ? L.yesterday : '';
    // "Day 14" — counted from the first public build of the project this day is about.
    const slug = items.find((e) => e.project === cfg.featured)?.project ?? items[0]?.project;
    const start = projects.get(slug)?.start;
    const n = start ? daysBetween(start, date) + 1 : 0;
    const catKeys = [...new Set(items.map((e) => e.category))];
    const relTag = rel ? `<span class="dl-day__rel">${esc(rel)}</span>` : '';
    return `
      <header class="dl-day__head" data-decode-area>
        ${n > 0 || rel ? `<p class="dl-day__no mono">${n > 0 ? `<span data-decode>${esc(L.day)} ${pad(n)}</span>` : ''}${relTag}</p>` : ''}
        <p class="dl-day__date"><time datetime="${date}">${fmtDate(date)}</time></p>
        <p class="dl-day__sum">${esc(count(items.length))}</p>
        <ul class="dl-day__cats" role="list">${catKeys.map((k) => `<li data-cat="${esc(k)}">${esc(catLabel(k))}</li>`).join('')}</ul>
      </header>`;
  }

  /** Newest day first. Within a day: clips and stills first (newest first), then notes without media. */
  function groupByDay(entries) {
    const sorted = [...entries].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      if (!!a.media !== !!b.media) return a.media ? -1 : 1;
      return String(b.createdAt).localeCompare(String(a.createdAt));
    });
    const days = new Map();
    for (const e of sorted) {
      if (!days.has(e.date)) days.set(e.date, []);
      days.get(e.date).push(e);
    }
    return [...days.entries()];
  }

  function day(date, items, today, { limit = Infinity, moreHref = '', active = '' } = {}) {
    const shown = items.slice(0, limit);
    const rest = items.length - shown.length;
    const visible = !active || items.some((e) => e.category === active);
    const cards = shown
      .map((e) => {
        const html = card(e);
        return active && e.category !== active ? html.replace('<li class="dl-card', '<li hidden class="dl-card') : html;
      })
      .join('');
    return `
    <section class="dl-day" id="d-${date}" data-day="${date}" data-reveal${visible ? '' : ' hidden'}>
      ${dayHead(date, items, today)}
      <div class="dl-day__body">
        <ol class="dl-cards" role="list">${cards}</ol>
        ${rest > 0 && moreHref ? `<a class="link-line dl-day__more" href="${esc(moreHref)}">${esc(L.more.replace('{n}', String(rest)))} <span aria-hidden="true">→</span></a>` : ''}
      </div>
    </section>`;
  }

  return {
    /** Full list for /devlog/ — all days; ?c=category hides the rest (the filter script can switch instantly). */
    list(entries, today, active = '') {
      if (!entries.length) return `<p class="dl-empty">No updates yet.</p>`;
      return `<div class="dl-list" data-devlog-list>${groupByDay(entries)
        .map(([date, items]) => day(date, items, today, { active }))
        .join('')}</div>`;
    },

    filters(entries, active = '') {
      const counts = new Map();
      for (const e of entries) counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
      const chip = (key, label, n) =>
        `<a class="dl-chip" href="/devlog/${key ? `?c=${encodeURIComponent(key)}` : ''}" data-cat="${esc(key)}"${key === active ? ' aria-current="true"' : ''} data-decode-area><span data-decode>${esc(label)}</span> <span class="dl-chip__n mono">${n}</span></a>`;
      const chips = cfg.categories.filter((c) => counts.has(c.key)).map((c) => chip(c.key, c.label, counts.get(c.key)));
      return `<nav class="dl-filters" aria-label="Filter by category" data-devlog-filters>${chip('', L.all, entries.length)}${chips.join('')}</nav>`;
    },

    stats(entries, today) {
      const days = new Set(entries.map((e) => e.date));
      const latest = [...days].sort().at(-1);
      const diff = latest ? daysBetween(latest, today) : null;
      const when = diff === 0 ? L.today : diff === 1 ? L.yesterday : latest ? fmtDate(latest) : '';
      return `<p class="dl-stats"><span class="status-dot" aria-hidden="true"></span><span>${esc(count(entries.length))}</span><span aria-hidden="true">·</span><span>${days.size} ${days.size === 1 ? 'day' : 'days'}</span>${when ? `<span aria-hidden="true">·</span><span>Latest: ${esc(when)}</span>` : ''}</p>`;
    },

    /** Home page: the latest day, up to three entries. */
    latest(entries, today) {
      const [first] = groupByDay(entries);
      if (!first) return '';
      const [date, items] = first;
      return day(date, items, today, { limit: 3, moreHref: `/devlog/#d-${date}` });
    },

    /** Project page: that project's latest two days, as a full section. Empty when there is nothing yet. */
    project(entries, today, slug, heading) {
      const mine = entries.filter((e) => e.project === slug && !e.seed);
      if (!mine.length) return '';
      const days = groupByDay(mine);
      const shown = days.slice(0, 2);
      return `
      <section id="devlog" class="dl-psection" aria-labelledby="h-devlog">
        <h2 id="h-devlog" class="dl-psection__head mono" data-decode-area>
          <span data-decode>${esc(heading)}</span>
          <span class="dl-psection__count">${esc(count(mine.length))}</span>
        </h2>
        <div class="dl-psection__content">
          ${shown.map(([date, items]) => day(date, items, today, { limit: 6 })).join('')}
          <a class="link-line dl-psection__all" href="/devlog/">${esc(L.cta)} <span aria-hidden="true">→</span></a>
        </div>
      </section>`;
    },
  };
}
