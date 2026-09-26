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
      'seftsaint is a one-person worldbuilding lab: original games and 3D worlds built in real engines, with AI in the loop, shared in public. Open to partners and investors.',
    /** 1200×630 image in /public */
    ogImage: '/og.jpg',
  },

  /** Small spaced capitals next to the wordmark (wide screens only). */
  disciplines: ['Games', '3D', 'AI', 'Worlds'],

  /* ── 1. HERO ─────────────────────────────────────────────── */
  hero: {
    kicker: 'A worldbuilding lab',
    /** Two lines. The second line is set in italic. */
    headline: ['Worlds', 'in progress.'],
    intro: 'Original games and 3D worlds — built in real engines, with AI in the loop, and shared in public as they take shape.',
    ctaWork: 'Explore the work',
    ctaWatch: 'Watch the latest build',
    /**
     * Full-screen footage. Real in-engine capture, cropped so the game HUD is out of frame.
     * `imageTall` / `loopTall` are the phone versions (portrait). Loops are muted.
     */
    media: {
      image: 'forest-concept/2026-09-25-last-update-hero.jpg',
      imageTall: 'forest-concept/2026-09-25-last-update-hero-tall.jpg',
      loop: 'forest-concept/2026-09-25-last-update-hero.mp4',
      loopTall: 'forest-concept/2026-09-25-last-update-hero-tall.mp4',
      alt: 'In-engine footage: a hooded traveller walks a sunlit path through a pine forest, rays of light falling between the trees.',
      focus: '50% 50%',
    },
    /** Top-right label on the footage — what you're looking at. */
    caption: ['In-engine footage', 'Unreal Engine — 25.09.2026'],
    /** Bottom-right words. */
    words: ['Build', 'Test', 'Share', 'Repeat'],
  },

  /* ── 2. FEATURED WORLD ───────────────────────────────────── */
  featured: {
    kicker: 'Featured world',
    cta: 'Enter the world',
    /** Stacked words over the strip. */
    words: ['Godot → Unreal', 'Four builds', 'Twelve days'],
  },

  /* ── 3. SIGNAL (under the featured world) ────────────────── */
  signal: {
    label: 'Built with',
    tools: ['Unreal Engine', 'Godot', 'Blender', 'Meshy'],
    /** Only facts. Second line is set in italic. */
    statement: ['Four public builds in twelve days.', '930K+ views on X.'],
    open: ['Open to', 'partners,', 'investors,', 'collaborators.'],
  },

  /* ── 4. LAB NOTES ────────────────────────────────────────── */
  notes: {
    kicker: 'Lab notes',
    headline: ['Every step,', 'in public.'],
    intro: 'Short notes from the work as it happens — first passes, engine switches, and the things I pause.',
    all: 'All notes on X',
  },

  /* ── 5. THE LAB (about) ──────────────────────────────────── */
  about: {
    kicker: 'The lab',
    /** Last line is set in italic. */
    statement: ['One person.', 'Real engines.', 'AI in the loop.'],
    lead: 'I make games, 3D scenes and experiments, using AI as a tool inside a real pipeline — Unreal, Godot, Blender — to build the things I imagine.',
    body: [
      'Everything is shared while it’s still taking shape: first passes, engine switches, and the things I pause and come back to.',
    ],
    toolkit: [
      { label: 'Engines', items: ['Unreal Engine', 'Godot'] },
      { label: '3D', items: ['Blender', 'Meshy'] },
      { label: 'AI', items: ['GPT-6 Astra', 'GPT-6 Luna', 'Opus 5.5', 'Codex'] },
    ],
  },

  connect: {
    heading: 'Follow along',
    text: 'Follow the work on X, or write to me directly.',
  },

  /* ── 6. PARTNERS & INVESTORS ─────────────────────────────── */
  /**
   * Keep it factual: what you're building, what would help, how to reach you.
   * Set `enabled: false` to hide the section and every invitation around the site.
   */
  partner: {
    enabled: true,
    kicker: 'For partners & investors',
    /** Used for small links around the site. */
    heroLink: 'Open to partners & investors',
    headline: ['Back the', 'next world.'],
    lead: 'This is early — and it’s moving fast.',
    body: [
      'In twelve days, one forest went from a first pass in Godot to a lit, living world in Unreal — shared in public at every step, and seen more than 930,000 times on X.',
      'The ideas aren’t the limit. The hardware is. Backing at this stage goes straight into the work.',
    ],
    unlocksTitle: 'What backing unlocks',
    unlocks: [
      { title: 'Hardware', text: 'A MacBook Pro or Mac Studio with the memory Unreal needs — so the worlds can look the way they’re meant to.' },
      { title: 'Fidelity', text: 'Characters, animation and light at the level the ideas deserve.' },
      { title: 'Scale', text: 'From public experiments to one complete, original world.' },
    ],
    /** Only real numbers. Update `proofNote` (the date) whenever you change them. */
    proof: [
      { value: '930K+', label: 'views on four public builds' },
      { value: '8.7K+', label: 'likes on those posts' },
      { value: '4', label: 'builds in twelve days' },
    ],
    proofNote: 'Counts from the four build posts on X, as of 26 Sep 2026.',
    ctaTalk: 'Let’s talk',
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

    /** Still used by the corner card. Real footage from the latest build. */
    media: {
      image: 'forest-concept/2026-09-25-last-update-rays.jpg',
      alt: 'A hooded character walks a forest trail through shafts of morning light, a small glowing bird flying beside them.',
    },
    madeOn: 'Made on a 16GB MacBook',

    /**
     * Where else on the site the partner invitation shows up.
     * Switch any of them off with `false`.
     */
    promote: {
      /** Small card in the corner after someone has seen the work (dismissible, remembered). */
      nudge: true,
      /** "Let's talk" button in the header. */
      headerPill: true,
      /** A "Back the next world" button when a demo video finishes. */
      afterVideo: true,
      /** A short note under a paused project's status. */
      projectNote: true,
      /** "Let's talk" in the closing section on every page. */
      footer: true,
      /** Numbers count up once when they scroll into view. */
      countUp: true,
    },

    /** The corner card. */
    nudge: {
      kicker: 'Open to partners',
      title: 'Back the next world.',
      text: 'The latest build was made on a 16GB MacBook — and it’s hit its limit.',
      cta: 'See how',
      /** Days the card stays away after someone closes it. */
      snoozeDays: 7,
    },

    /** Under a paused project's status (project pages). */
    projectNote: {
      text: 'Paused because the hardware hit its limit. The right machine — or the right partner — is what the next world needs.',
      cta: 'Back the next world',
    },

    /** Button on the end screen of a demo video. */
    afterVideo: 'Back the next world',
    footerLine: 'Open to partners & investors',
  },

  /* ── 7. CLOSING (bottom of every page) ───────────────────── */
  closing: {
    kicker: 'Still in progress',
    /** Second line is set in italic. */
    line: ['The map is', 'still being drawn.'],
    text: 'Follow the next build, or write to me directly.',
    ctaWrite: 'Write to me',
    ctaFollow: 'Follow on X',
  },
} as const;
