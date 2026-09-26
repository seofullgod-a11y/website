/**
 * ─────────────────────────────────────────────────────────────
 *  YOUR DETAILS + PAGE COPY
 *  Change your name, links and the words on the home page here.
 *  Buttons / section labels live in ui.ts.
 *  Projects → projects.ts · Journal + "Now" → updates.ts
 * ─────────────────────────────────────────────────────────────
 */

export const site = {
  /** Display name — used in the wordmark, titles and footer. */
  name: 'seftsaint',
  handle: '@seftsaint',
  xUrl: 'https://x.com/seftsaint',

  /**
   * Your live URL once deployed, e.g. 'https://seftsaint.com' (no trailing slash).
   * Needed for canonical links and absolute social-preview images.
   * Leave '' on Railway to use its generated *.up.railway.app domain automatically.
   */
  url: '',

  /** <html lang>. Use 'th' if you switch the copy to Thai. */
  lang: 'en',
  /** Date format. 'en-GB' → 25 Sep 2026 · 'th-TH' → 25 ก.ย. 2569 */
  locale: 'en-GB',
  timeZone: 'Asia/Bangkok',

  meta: {
    title: 'seftsaint — Worlds in progress',
    description:
      'Games, 3D scenes and AI-assisted experiments by seftsaint, shared while they are still taking shape.',
    /** 1200×630 image in /public */
    ogImage: '/og.jpg',
  },

  hero: {
    kicker: 'Portfolio & journal',
    /** Two lines. The second line is set in the italic serif. */
    headline: ['Worlds', 'in progress.'],
    intro: 'Games, 3D scenes and experiments — built with AI as a tool, shared while they’re still taking shape.',
  },

  about: {
    lead: 'I make games, 3D scenes and experiments, using AI as a tool to build the things I imagine.',
    body: [
      'This site keeps the work in one place, finished or not — first passes, engine switches, and the things I’ve paused and may come back to.',
      'I share progress on X as it happens.',
    ],
  },

  connect: {
    heading: 'Follow along',
    text: 'X is the best place to follow the work or reach me.',
  },
} as const;
