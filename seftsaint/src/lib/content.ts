import { projects } from '../data/projects';
import { updates } from '../data/updates';
import type { Project, Update } from '../data/types';

const time = (iso?: string) => (iso ? new Date(iso).getTime() : 0);

/** Published projects only (drafts hidden). */
export function getProjects(): Project[] {
  const list = projects.filter((p) => !p.draft);
  const latest = (p: Project) =>
    Math.max(time(p.period?.end ?? p.period?.start), ...getUpdatesFor(p.slug).map((u) => time(u.date)));
  return [...list].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    if (a.order !== undefined || b.order !== undefined) return (a.order ?? 999) - (b.order ?? 999);
    return latest(b) - latest(a);
  });
}

export function getFeatured(): Project | undefined {
  const list = getProjects();
  return list.find((p) => p.featured) ?? list[0];
}

export function getProject(slug: string): Project | undefined {
  return getProjects().find((p) => p.slug === slug);
}

/** Newest first. Entries linked to a draft project are hidden. */
export function getUpdates(): Update[] {
  const drafts = new Set(projects.filter((p) => p.draft).map((p) => p.slug));
  return updates
    .filter((u) => !u.project || !drafts.has(u.project))
    .sort((a, b) => time(b.date) - time(a.date));
}

/** Oldest first — reads as a story on the project page. */
export function getUpdatesFor(slug: string): Update[] {
  return updates.filter((u) => u.project === slug).sort((a, b) => time(a.date) - time(b.date));
}

/** Guard against typos: an update pointing at a project that doesn't exist. */
for (const u of updates) {
  if (u.project && !projects.some((p) => p.slug === u.project)) {
    console.warn(`\x1b[33m[content]\x1b[0m update "${u.id}" points to unknown project "${u.project}"`);
  }
}
const ids = new Set<string>();
for (const u of updates) {
  if (ids.has(u.id)) console.warn(`\x1b[33m[content]\x1b[0m duplicate update id "${u.id}"`);
  ids.add(u.id);
}
