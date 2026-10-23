/**
 * Build-time settings for server.mjs (read from dist/server-config.json at start-up):
 * which mode the site is in, where the contact form sends to, and old URLs to redirect.
 * Nothing secret lives here — the email key stays in Railway's Variables.
 */
import type { APIRoute } from 'astro';
import { site } from '../data/site';
import { getProjects } from '../lib/content';

export const GET: APIRoute = () => {
  const redirects = Object.fromEntries(
    getProjects().flatMap((p) => (p.formerSlugs ?? []).map((old) => [`/work/${old}/`, `/work/${p.slug}/`])),
  );
  const body = {
    mode: site.mode,
    name: site.name,
    email: site.email,
    contact: {
      game: `${site.contact.title}${site.contact.mark}`,
      roles: site.contact.form.roleOptions,
      labels: {
        name: site.contact.form.name,
        email: site.contact.form.email,
        roles: site.contact.form.roles,
        message: site.contact.form.message,
        link: site.contact.form.link,
      },
    },
    timeZone: site.timeZone,
    redirects,
  };
  return new Response(JSON.stringify(body, null, 2), { headers: { 'Content-Type': 'application/json' } });
};
