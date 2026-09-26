// @ts-check
import { defineConfig } from 'astro/config';

// Static site. `npm run build` writes everything to /dist.
// Railway / any Node host: `npm start` serves /dist with server.mjs.
// Static hosts (Vercel, Netlify, Cloudflare Pages…): publish the /dist folder.
export default defineConfig({
  // Full site URL, used for canonical links and social-preview images.
  // Priority: src/data/site.ts → `url`, then SITE_URL, then Railway's generated domain.
  site:
    process.env.SITE_URL ||
    (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : undefined),
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  devToolbar: {
    enabled: false,
  },
});
