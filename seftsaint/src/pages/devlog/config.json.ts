/**
 * Build-time data for the devlog server (server/devlog.mjs reads dist/devlog/config.json):
 * categories and labels (src/data/devlog.ts), projects, and the builds already
 * shared on X — shown as the first devlog entries.
 */
import type { APIRoute } from 'astro';
import { getImage } from 'astro:assets';
import { devlog } from '../../data/devlog';
import { site } from '../../data/site';
import { getProjects, getUpdates, getUpdatesFor, getFeatured } from '../../lib/content';
import { resolveImage, resolveVideo } from '../../lib/media';

/** YYYY-MM-DD in the site's time zone. */
const ymd = (iso: string) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: site.timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(iso),
  );

export const GET: APIRoute = async () => {
  const projects = getProjects().map((p) => {
    const first = getUpdatesFor(p.slug)[0];
    return {
      slug: p.slug,
      title: p.title,
      href: `/work/${p.slug}/`,
      start: first ? ymd(first.date) : p.period?.start?.slice(0, 10) ?? null,
    };
  });

  const seeds = devlog.includeBuilds
    ? await Promise.all(
        getUpdates()
          .filter((u) => u.project)
          .map(async (u) => {
            const img = resolveImage(u.media?.image);
            const poster = img ? (await getImage({ src: img, width: 960, format: 'webp', quality: 76 })).src : null;
            const clip = resolveVideo(u.media?.video) ?? null;
            const preview = resolveVideo(u.media?.preview) ?? null;
            return {
              id: `x-${u.id}`,
              seed: true,
              date: ymd(u.date),
              createdAt: new Date(u.date).toISOString(),
              project: u.project,
              category: 'build',
              title: u.title,
              text: u.excerpt ?? u.body[0] ?? '',
              link: u.sourceUrl ?? u.media?.sourceUrl ?? null,
              media: poster ? { type: clip ? 'video' : 'image', poster, clip, preview, alt: u.media?.alt ?? '' } : null,
            };
          }),
      )
    : [];

  const body = {
    timeZone: site.timeZone,
    featured: getFeatured()?.slug ?? projects[0]?.slug ?? null,
    categories: devlog.categories.map(({ key, label, hint }) => ({ key, label, hint })),
    labels: {
      kicker: devlog.kicker,
      cta: devlog.cta,
      all: devlog.all,
      day: devlog.day,
      today: devlog.today,
      yesterday: devlog.yesterday,
      updateOne: devlog.update(1).replace(/^1 /, ''),
      updateMany: devlog.update(2).replace(/^2 /, ''),
      more: devlog.more(0).replace('0', '{n}'),
      watch: devlog.watch,
      onX: devlog.onX,
    },
    projects,
    seeds,
  };
  return new Response(JSON.stringify(body, null, 2), { headers: { 'Content-Type': 'application/json' } });
};
