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
    pending: 'Media not added yet',
    unavailable: 'Video unavailable',
  },

  journal: {
    intro: 'Short notes on what I’m making, testing, pausing and coming back to.',
    viewPost: 'View post',
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
