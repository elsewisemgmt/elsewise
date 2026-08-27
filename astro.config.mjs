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
});
