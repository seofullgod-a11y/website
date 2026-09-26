import type { Project } from './types';

/**
 * ─────────────────────────────────────────────────────────────
 *  PROJECTS
 *  Add a project = add one object to the array below. That's it —
 *  the home page, the project page (/work/<slug>/) and the journal
 *  links are generated from this list.
 *
 *  Media:
 *    images → src/assets/media/<slug>/...   (jpg / png / webp)
 *    videos → public/media/<slug>/...       (mp4, H.264)
 *
 *  Dated progress posts live in updates.ts — set `project: '<slug>'`
 *  there and they appear on the project page automatically.
 *
 *  Copy-paste template (remove `draft: true` when ready):
 *
 *  {
 *    slug: 'my-new-thing',
 *    title: 'My New Thing',
 *    summary: 'One or two honest sentences.',
 *    types: ['Experiment'],
 *    status: 'experiment',            // 'in-progress' | 'experiment' | 'paused' | 'released'
 *    period: { start: '2026-10-01' },
 *    tools: ['Godot'],
 *    cover: {
 *      image: 'my-new-thing/cover.jpg',
 *      video: 'my-new-thing/preview.mp4',   // optional
 *      alt: 'What is visible in the frame',
 *    },
 *    draft: true,
 *  },
 * ─────────────────────────────────────────────────────────────
 */

export const projects: Project[] = [
  {
    slug: 'forest-concept',
    // No official name was given in the posts — "the concept" is how it's described.
    // Rename freely; the URL stays the same unless you change `slug`.
    title: 'Forest Concept',
    workingTitle: true,
    summary:
      'A third-person walk through a forest. It started in Godot, moved to Unreal, and went through several passes on the trees, lighting and characters — built with AI models connected to my tools.',
    oneLiner: 'A third-person forest world. First pass in Godot, rebuilt in Unreal — four public builds in twelve days.',
    types: ['Game prototype', '3D', 'AI workflow'],
    status: 'paused',
    statusShort: 'The hardware hit its limit',
    statusNote:
      'This was my last update on this one. My 16GB MacBook started to struggle with Unreal, so I’m thinking about going back to Godot and making a different game instead.',
    featured: true,
    period: { start: '2026-09-14', end: '2026-09-25', label: 'Shared on X' },
    tools: ['Godot', 'Unreal Engine', 'Blender', 'Codex', 'Meshy'],
    ai: ['GPT-6 Astra', 'GPT-6 Luna', 'Opus 5.5'],
    cover: {
      image: 'forest-concept/2026-09-25-last-update.jpg',
      // Short muted loop (plays when visible) + the full demo (plays on click).
      // Made from the original recording with `npm run media` (see README).
      preview: 'forest-concept/2026-09-25-last-update-preview.mp4',
      video: 'forest-concept/2026-09-25-last-update.mp4',
      alt: 'A hooded character with a backpack walks a forest trail at dawn while a small glowing bird hovers beside them.',
      sourceUrl: 'https://x.com/seftsaint/status/2103491735855022174',
      focus: '46% 50%',
    },
    sections: [
      {
        id: 'concept',
        heading: 'Concept',
        paragraphs: [
          'A small forest world, explored in third person. A little bird guides you along the trail.',
          'I built the first version in Godot, then moved the same concept over to Unreal and kept reworking it — first the trees and lighting, later the characters and other parts of the scene in Blender.',
        ],
      },
      {
        id: 'setup',
        heading: 'How I set it up',
        list: {
          ordered: true,
          items: [
            'Collect images or videos that capture the look I want, in their own folder — for example Game/Ref.',
            'Connect Godot MCP and Blender MCP to Codex.',
            'Let Astra read the files in the Ref folder, so it understands the overall visual direction and style.',
            'If possible, install the Dream-loop skill. It helps the AI work more effectively and match the references more closely.',
          ],
        },
        footnote: 'From my thread on the Godot version, 14 Sep 2026.',
      },
      {
        id: 'notes',
        heading: 'What I’m learning',
        list: {
          items: [
            'Ready-made assets from Meshy were fast to drop in, but they felt lifeless and lacked realism — so I started reworking the characters and other parts of the scene in Blender.',
            'Opus 5.5 has worked really well for building characters and assets in Blender.',
            'Astra still understands 3D better. Its biggest downside is how many tokens it uses.',
            'GPT-6 Luna did a pretty good job taking over 3D work from Astra, on far fewer tokens. It didn’t build the whole thing — Astra built it first, then Luna worked on top. I’ve been switching back and forth between the two.',
          ],
        },
      },
    ],
  },
];
