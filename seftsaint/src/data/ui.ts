/**
 * ─────────────────────────────────────────────────────────────
 *  UI LABELS
 *  Every small piece of interface text lives here, so the site can be
 *  switched to Thai (or anything else) without touching the layout.
 * ─────────────────────────────────────────────────────────────
 */

export const ui = {
  skipToContent: 'Skip to content',

  nav: {
    work: 'Work',
    journal: 'Journal',
    about: 'About',
    partner: 'Partner',
    x: 'X',
    home: 'Home',
  },

  hero: {
    viewWork: 'View work',
    followX: 'Follow on X',
    latest: 'Latest',
  },

  sections: {
    work: 'Selected work',
    moreWork: 'More work',
    journal: 'Journal',
    now: 'Now',
    about: 'About',
    connect: 'Connect',
    partner: 'Partner',
  },

  status: {
    'in-progress': 'In progress',
    experiment: 'Experiment',
    paused: 'Paused',
    released: 'Released',
  },

  count: {
    project: (n: number) => `${n} ${n === 1 ? 'project' : 'projects'}`,
    update: (n: number) => `${n} ${n === 1 ? 'update' : 'updates'}`,
  },

  project: {
    view: 'View project',
    allWork: 'All work',
    workingTitle: 'Working title',
    status: 'Status',
    type: 'Type',
    timeline: 'Timeline',
    builtWith: 'Built with',
    ai: 'AI',
    progress: 'Progress',
    progressIntro: 'Each step as it was shared, oldest first.',
    sources: 'Original posts',
    gallery: 'More media',
    links: 'Links',
    next: 'Next',
    previous: 'Previous',
    onThisPage: 'On this page',
  },

  media: {
    play: 'Play',
    playVideo: 'Play video',
    pause: 'Pause',
    pausePreview: 'Pause preview',
    playPreview: 'Play preview',
    watchOnX: 'Watch on X',
    playDemo: 'Play demo',
    moreOnX: 'More on X',
    replay: 'Watch again',
    close: 'Close',
    playerNote: 'The post, the thread and the replies are on X.',
    pending: 'Media not added yet',
    unavailable: 'Video unavailable',
  },

  fx: {
    /** Evolution viewer (home page) */
    stages: 'Stages',
    showStage: 'Show stage',
    scrubHint: 'Move across to scrub',
    /** Compare slider (project page) */
    compareHeading: 'Then & now',
    compareLabel: 'Compare the first and the latest frame',
    compareHint: 'Drag the divider',
  },

  about: {
    soFar: 'So far',
    toolkit: 'Toolkit',
    tools: 'Tools',
    ai: 'AI',
    now: 'Now',
  },

  partner: {
    /** Screen-reader name of the corner card. */
    nudgeLabel: 'Partner invitation',
    closeNudge: 'Close — don’t show for a while',
    /** Announced after "Copy email". */
    copiedAnnounce: 'Email address copied',
  },

  journal: {
    intro: 'Short notes on what I’m making, testing, pausing and coming back to.',
    viewPost: 'More on X',
    project: 'Project',
    updated: 'Updated',
    older: 'Older notes on X',
  },

  footer: {
    note: 'A quiet space for worlds in progress.',
    top: 'Back to top',
  },

  notFound: {
    title: 'Nothing here yet.',
    body: 'This page doesn’t exist — or it’s still being built.',
    back: 'Back home',
  },
} as const;
