// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://elsewisemgmt.com',

  // Static by default: every public page is prerendered to a file and served
  // straight from Cloudflare's static assets. The Worker only ever executes
  // for routes that explicitly opt out via `export const prerender = false`,
  // which in practice means the Keystatic admin and its API.
  adapter: cloudflare({
    // 'compile' optimises images at build time with sharp and passes through
    // at runtime. Correct here because every image-bearing page is prerendered,
    // so no runtime image service (and no Images binding) is needed.
    imageService: 'compile',
    // Prerender in Node rather than workerd so sharp is available during build.
    prerenderEnvironment: 'node',
  }),
});
