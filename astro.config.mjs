// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';

// https://astro.build/config
export default defineConfig({
  site: 'https://elsewisemgmt.com',

  // Static by default: every public page is prerendered to a file and served
  // straight from Cloudflare's static assets. The Worker only ever executes
  // for routes that opt out via `export const prerender = false` — which is
  // just the two routes the Keystatic integration injects:
  //   /keystatic/[...params]      the admin UI (React, admin-only)
  //   /api/keystatic/[...params]  the GitHub App OAuth + commit API
  // No public page ships React or hits the Worker.
  adapter: cloudflare({
    // 'compile' optimises images at build time with sharp and passes through
    // at runtime. Correct here because every image-bearing page is prerendered,
    // so no runtime image service (and no Images binding) is needed.
    imageService: 'compile',
    // Prerender in Node rather than workerd so sharp is available during build.
    prerenderEnvironment: 'node',
  }),

  integrations: [react(), markdoc(), keystatic()],

  // The Cloudflare adapter otherwise auto-provisions a KV namespace to back
  // Astro sessions. Nothing here uses them — the only on-demand routes are
  // Keystatic's, which carry their own auth — so the binding is pure overhead.
  session: false,

  vite: {
    optimizeDeps: {
      // Keystatic's API handler depends on `cookie` (pure CJS, no exports map)
      // and `superstruct` (CJS main). The dev server loaded them raw into its
      // workerd runner, which is ESM-only, so /api/keystatic/* died with
      // "exports is not defined" — the GitHub OAuth handshake, i.e. the whole
      // of GitHub mode, was unusable locally.
      //
      // Prebundling converts them to ESM up front. The Cloudflare adapter
      // merges this list into its own allowlist for the server environments.
      // Production was never affected: Rolldown wraps CJS correctly at build.
      // Keystatic's own entrypoints are listed too. Left to be discovered
      // mid-request they trigger "optimized dependencies changed. reloading",
      // and the workerd runner does not survive that reload — the dev server
      // exits before becoming ready. It only bites on a cold cache, so it
      // looks intermittent: the first `npm run dev` after an install fails and
      // the next one works. Prebundling them at startup avoids the reload.
      include: [
        'cookie',
        'superstruct',
        '@keystatic/astro/internal/keystatic-api.js',
        '@keystatic/core/api/generic',
      ],
    },
  },
});
