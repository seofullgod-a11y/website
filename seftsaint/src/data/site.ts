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
      'Games, 3D scenes and AI-assisted experiments by seftsaint, shared while they are still taking shape. Open to partners and investors.',
    /** 1200×630 image in /public */
    ogImage: '/og.jpg',
  },

  hero: {
    kicker: 'Portfolio & journal',
    /** Two lines. The second line is set in the italic serif. */
    headline: ['Worlds', 'in progress.'],
    intro: 'Games, 3D scenes and experiments — built with AI as a tool, shared while they’re still taking shape.',
    /**
     * Facts row under the hero — counts up on the first visit.
     * Only real numbers (these come from the four posts on X, as of 26 Sep 2026).
     * Empty list = no row.
     */
    facts: [
      { value: '4', label: 'public demos on X' },
      { value: '12', label: 'days from first pass to last update' },
      { value: '2', label: 'engines — Godot, then Unreal' },
      { value: '930K+', label: 'views across those posts' },
    ],
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
    /** Pre-filled email text — makes it easy for someone to write the first message. */
    emailBody: [
      'Hi seftsaint,',
      '',
      'I saw your work and I’m interested in:',
      '[ ] investing   [ ] hardware   [ ] partnering on a game',
      '',
      'About me:',
      '',
    ].join('\n'),
    ctaEmail: 'Email me',
    ctaX: 'Message on X',
    ctaCopy: 'Copy email',
    ctaCopied: 'Copied',

    /** The frame shown next to the pitch. Real footage from the latest demo. */
    media: {
      image: 'forest-concept/2026-09-25-last-update-rays.jpg',
      preview: 'forest-concept/2026-09-25-last-update-preview.mp4',
      video: 'forest-concept/2026-09-25-last-update.mp4',
      alt: 'A hooded character walks a forest trail through shafts of morning light, a small glowing bird flying beside them.',
      sourceUrl: 'https://x.com/seftsaint/status/2103491735855022174',
    },
    mediaTitle: 'Last update — setting it aside',
    mediaMeta: '25 Sep 2026 · Unreal Engine',
    /** Caption on that frame. */
    madeOn: 'Made on a 16GB MacBook',
    madeOnNote: 'This is where it hit its limit.',

    /**
     * Where else on the site the partner invitation shows up.
     * Switch any of them off with `false`.
     */
    promote: {
      /** Small card in the corner after someone has seen the work (dismissible, remembered). */
      nudge: true,
      /** "Partner" in the header gets a dot and a thin outline. */
      headerPill: true,
      /** A "Back the next world" button when a demo video finishes. */
      afterVideo: true,
      /** A short note under a paused project's status. */
      projectNote: true,
      /** A line in the footer on every page. */
      footer: true,
      /** Numbers count up once when they scroll into view. */
      countUp: true,
    },

    /** The corner card. */
    nudge: {
      kicker: 'Open to partners',
      title: 'Help build the next world.',
      text: 'The latest demo was made on a 16GB MacBook — and it’s hit its limit.',
      cta: 'See how',
      /** Days the card stays away after someone closes it. */
      snoozeDays: 7,
    },

    /** Under a paused project's status (project pages). */
    projectNote: {
      text: 'Paused because the hardware hit its limit. The right machine — or the right partner — is what the next world needs.',
      cta: 'Back the next world',
    },

    /** Button on the end screen of a demo video, and the footer line. */
    afterVideo: 'Back the next world',
    footerLine: 'Open to partners & investors',
  },
} as const;
