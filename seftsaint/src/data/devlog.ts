/**
 * ─────────────────────────────────────────────────────────────
 *  DEVLOG — day-by-day updates with clips
 *
 *  You post updates from /studio (password: STUDIO_PASSWORD on Railway).
 *  They are stored on the Railway volume, not in GitHub, and appear on:
 *    · /devlog/            every update, grouped by day, filter by category
 *    · the home page       the latest day (section "Devlog")
 *    · the project page    that project's latest days
 *
 *  This file only holds the words and the categories.
 *  Change a label freely; don't rename a `key` once you've used it.
 * ─────────────────────────────────────────────────────────────
 */

export interface DevlogCategory {
  key: string;
  /** Shown on the site. */
  label: string;
  /** Shown under the chip in the studio (a hint for you). */
  hint: string;
}

export const devlog = {
  /** Categories, in the order they appear in the studio and the filter. */
  categories: [
    { key: 'world', label: 'World', hint: 'ฉาก พื้นที่ ต้นไม้ ภูมิประเทศ' },
    { key: 'characters', label: 'Characters', hint: 'ตัวละคร โมเดล ริก แอนิเมชัน' },
    { key: 'lighting', label: 'Lighting', hint: 'แสง หมอก สี เงา การเรนเดอร์' },
    { key: 'gameplay', label: 'Gameplay', hint: 'ระบบเกม การควบคุม กล้อง' },
    { key: 'ui', label: 'UI', hint: 'HUD เมนู หน้าจอ' },
    { key: 'ai', label: 'AI workflow', hint: 'โมเดล AI พรอมต์ เครื่องมือ' },
    { key: 'tech', label: 'Tech', hint: 'ประสิทธิภาพ เอนจิน ไปป์ไลน์ บั๊ก' },
    { key: 'audio', label: 'Audio', hint: 'เสียง ดนตรี' },
    { key: 'build', label: 'Build', hint: 'บิลด์ที่ปล่อย / โพสต์ใหญ่' },
  ] satisfies DevlogCategory[],

  /** The four builds already shared on X show up as the first entries (category "Build"). */
  includeBuilds: true,

  /** Words on the site. */
  kicker: 'Devlog',
  headline: ['The devlog.', 'Day by day.'],
  intro: 'Short clips of what changed in the world — posted the day it happened.',
  /** Home page: button to the full page. */
  cta: 'All updates',
  /** Filter chip that shows everything. */
  all: 'All',
  /** "Day 14" — counted from the project's first public build. */
  day: 'Day',
  today: 'Today',
  yesterday: 'Yesterday',
  update: (n: number) => `${n} ${n === 1 ? 'update' : 'updates'}`,
  more: (n: number) => `+${n} more that day`,
  watch: 'Watch',
  onX: 'On X',
  /** Shown when the page is opened without the server (e.g. `npm run dev`). */
  offline: 'Devlog entries appear here when the site runs on its server (npm start).',
  /** Project page heading. */
  projectHeading: 'Devlog',
} as const;
