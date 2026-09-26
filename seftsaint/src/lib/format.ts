import { site } from '../data/site';

/**
 * Date helpers. English locales use a fixed "25 Sep 2026" style;
 * any other locale (e.g. 'th-TH') uses the browser/Node Intl format for it.
 */

const tz = site.timeZone;
const isEn = site.locale.toLowerCase().startsWith('en');

function en(iso: string) {
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).formatToParts(new Date(iso));
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? '';
  return { day: get('day'), month: get('month'), year: get('year') };
}

/** 25 Sep 2026 */
export function formatDate(iso: string): string {
  if (isEn) {
    const d = en(iso);
    return `${d.day} ${d.month} ${d.year}`;
  }
  return new Intl.DateTimeFormat(site.locale, { timeZone: tz, day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(iso),
  );
}

/** 25.09.26 — compact, for captions. */
export function formatDateNumeric(iso: string): string {
  const p = new Intl.DateTimeFormat(site.locale, {
    timeZone: tz,
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).formatToParts(new Date(iso));
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? '';
  return `${get('day')}.${get('month')}.${get('year')}`;
}

/** Sep 2026 */
export function formatMonth(iso: string): string {
  if (isEn) {
    const d = en(iso);
    return `${d.month} ${d.year}`;
  }
  return new Intl.DateTimeFormat(site.locale, { timeZone: tz, month: 'short', year: 'numeric' }).format(new Date(iso));
}

/** 14–25 Sep 2026 · 28 Aug – 3 Sep 2026 · 12 Dec 2025 – 4 Jan 2026 */
export function formatRange(start: string, end?: string): string {
  if (!end || start === end) return formatDate(start);
  if (isEn) {
    const a = en(start);
    const b = en(end);
    if (a.year === b.year && a.month === b.month) return `${a.day}–${b.day} ${b.month} ${b.year}`;
    if (a.year === b.year) return `${a.day} ${a.month} – ${b.day} ${b.month} ${b.year}`;
    return `${formatDate(start)} – ${formatDate(end)}`;
  }
  return new Intl.DateTimeFormat(site.locale, {
    timeZone: tz,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).formatRange(new Date(start), new Date(end));
}
