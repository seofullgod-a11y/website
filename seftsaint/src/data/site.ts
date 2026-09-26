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
  /** Contact email — shown in Partner + Connect. Set to '' to hide it everywhere. */
  email: 'seftsaint1@gmail.com',

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
    text: 'Follow the work on X, or write to me directly.',
  },

  /**
   * PARTNER / INVESTORS section on the home page.
   * Keep it factual: what you're building, what would help, how to reach you.
   * Set `enabled: false` to hide the whole section (and the hero link).
   */
  partner: {
    enabled: true,
    /** Small link under the hero buttons. */
    heroLink: 'Open to partners & investors',
    headline: ['Back the', 'next world.'],
    lead: 'I’m looking for investors and partners who want to back games and 3D worlds built with AI.',
    body: [
      'Right now the limit is hardware. My 16GB MacBook started to struggle with Unreal — a MacBook Pro or Mac Studio with more memory would let me keep pushing the visuals, and keep building in public.',
    ],
    needs: [
      { label: 'Hardware', text: 'A MacBook Pro or Mac Studio with more memory — to keep making good-looking games with AI.' },
      { label: 'Investment', text: 'Open to talking with investors who want to back the next project.' },
    ],
    /** Only real numbers. Update `proofNote` (the date) whenever you change them. */
    proof: [
      { value: '4', label: 'public demos in 12 days' },
      { value: '930K+', label: 'views on those four posts' },
      { value: '8.7K+', label: 'likes on those four posts' },
    ],
    proofNote: 'Counts from the four demo posts on X, as of 26 Sep 2026.',
    emailSubject: 'Partnership — seftsaint',
    ctaEmail: 'Email me',
    ctaX: 'Message on X',
  },
} as const;
