import type { NowItem, Update } from './types';

/**
 * ─────────────────────────────────────────────────────────────
 *  JOURNAL + NOW
 *
 *  `now`      → the small "Now" note on the home page. Keep it short.
 *  `updates`  → dated journal entries. Newest are shown first on the
 *               home page; on a project page they become its progress
 *               timeline (oldest first). Order in this file doesn't
 *               matter — sorting uses `date`.
 *
 *  Link an entry to a project with `project: '<slug>'`.
 * ─────────────────────────────────────────────────────────────
 */

export const now: { updated: string; items: NowItem[] } = {
  updated: '2026-09-25',
  items: [
    {
      label: 'Paused',
      text: 'Forest Concept — Unreal is getting heavy on my 16GB MacBook.',
      href: '/work/forest-concept/',
    },
    {
      label: 'Next',
      text: 'Thinking about going back to Godot to make a different game.',
    },
    {
      label: 'Tools lately',
      text: 'Godot, Unreal, Blender — with GPT-6 Astra, GPT-6 Luna and Opus 5.5.',
    },
  ],
};

export const updates: Update[] = [
  {
    id: 'last-update',
    date: '2026-09-25T21:28:05+07:00',
    title: 'Last update — setting it aside',
    label: 'Last update',
    project: 'forest-concept',
    body: [
      'My 16GB MacBook is starting to struggle with Unreal, so this is my last post on this project. I’m thinking about going back to Godot and making a different game instead.',
      'Before this I used ready-made assets from Meshy. Fast, but lifeless — so I started reworking the characters and other parts of the scene in Blender, with Opus 5.5 building characters and assets.',
    ],
    tools: ['Unreal Engine', 'Blender', 'GPT-6 Astra', 'Opus 5.5'],
    media: {
      image: 'forest-concept/2026-09-25-last-update.jpg',
      video: 'forest-concept/2026-09-25-last-update.mp4',
      alt: 'A hooded character with a backpack on a sunlit forest trail, a small glowing bird beside them.',
      sourceUrl: 'https://x.com/seftsaint/status/2103491735855022174',
      interim: true,
    },
    sourceUrl: 'https://x.com/seftsaint/status/2103491735855022174',
  },
  {
    id: 'luna-pass',
    date: '2026-09-23T21:45:44+07:00',
    title: 'Trying GPT-6 Luna',
    label: 'Luna pass',
    project: 'forest-concept',
    body: [
      'Tried GPT-6 Luna today. It does a pretty good job taking over the 3D work from Astra, and it doesn’t eat nearly as many tokens.',
      'To be clear, Luna didn’t build the whole thing — Astra built it first, then Luna worked on top of it. I’ve been switching back and forth between the two.',
    ],
    tools: ['GPT-6 Luna', 'GPT-6 Astra'],
    media: {
      image: 'forest-concept/2026-09-23-luna.jpg',
      video: 'forest-concept/2026-09-23-luna.mp4',
      alt: 'A character with a large backpack on a forest path, with a health bar, minimap and item bar on screen.',
      sourceUrl: 'https://x.com/seftsaint/status/2102771402210476533',
      interim: true,
    },
    sourceUrl: 'https://x.com/seftsaint/status/2102771402210476533',
  },
  {
    id: 'moved-to-unreal',
    date: '2026-09-20T02:39:14+07:00',
    title: 'Moved to Unreal',
    label: 'Unreal',
    project: 'forest-concept',
    body: [
      'Got a new MacBook, so I tried switching from Godot to Unreal. I moved the concept I’d already made in Godot over, then changed the trees and lighting.',
      'Moving everything over used a lot of tokens. Next time I’m going all in on animation.',
    ],
    tools: ['Unreal Engine', 'Blender', 'GPT-6 Astra'],
    media: {
      image: 'forest-concept/2026-09-20-unreal.jpg',
      video: 'forest-concept/2026-09-20-unreal.mp4',
      alt: 'A small character in a green cap walking along a dirt path through tall grass, with a minimap in the corner.',
      sourceUrl: 'https://x.com/seftsaint/status/2101395711015497764',
      interim: true,
    },
    sourceUrl: 'https://x.com/seftsaint/status/2101395711015497764',
  },
  {
    id: 'godot-first-pass',
    date: '2026-09-14T22:42:58+07:00',
    title: 'First pass in Godot',
    label: 'Godot',
    project: 'forest-concept',
    body: [
      'Godot + Blender, built with GPT-6 Astra. I hit the limit twice, but overall it turned out beautifully.',
    ],
    tools: ['Godot', 'Blender', 'GPT-6 Astra'],
    media: {
      image: 'forest-concept/2026-09-14-godot.jpg',
      video: 'forest-concept/2026-09-14-godot.mp4',
      alt: 'A small character with a shield stands in a forest clearing next to a wooden archway and a cooking pot.',
      sourceUrl: 'https://x.com/seftsaint/status/2099524314546700370',
      interim: true,
    },
    sourceUrl: 'https://x.com/seftsaint/status/2099524314546700370',
  },
];
