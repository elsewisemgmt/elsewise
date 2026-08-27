/**
 * Heavy-asset resolution.
 *
 * Display images live in `src/assets/` and are optimised by Astro at build
 * time. Everything heavy — hi-res press shot originals, tech riders, stage
 * plots — lives outside the repo and is referenced by a short key or a full
 * URL. This module is the single place that turns a stored reference into a
 * fetchable URL.
 *
 * Today that is an R2 bucket on a custom domain. Moving to Google Drive means
 * changing `ASSET_PROVIDER` below and filling in `driveDirectUrl`; no schema
 * change, no content migration for entries that already store a full URL.
 */

export type AssetProvider = 'r2' | 'drive';

/** Swap this to 'drive' to pivot providers. */
export const ASSET_PROVIDER: AssetProvider = 'r2';

/** Public base URL of the R2 bucket. Bare keys are resolved against it. */
export const R2_PUBLIC_BASE = 'https://files.elsewisemgmt.com';

/**
 * A stored asset reference. Either:
 *  - a bare key relative to the provider, e.g. `nova-halle/tech-rider.pdf`
 *  - a full `https://` URL, which is passed through (and normalised if it is
 *    a Google Drive share link)
 */
export type AssetRef = string;

const DRIVE_ID = /\/file\/d\/([a-zA-Z0-9_-]+)|[?&]id=([a-zA-Z0-9_-]+)/;

/**
 * Turn a Google Drive file id into a direct-download URL.
 *
 * Deliberately minimal. A real Drive pivot should serve these through a Worker
 * route so the files can stay private and the ids never reach the browser;
 * this is the shape that pivot slots into, not the finished thing.
 */
export function driveDirectUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`;
}

/** Rewrite a Google Drive *share* link into a direct-download link. */
function normaliseExternal(url: string): string {
  if (!url.includes('drive.google.com')) return url;
  const match = url.match(DRIVE_ID);
  const fileId = match?.[1] ?? match?.[2];
  return fileId ? driveDirectUrl(fileId) : url;
}

/** Resolve a stored asset reference to a URL the browser can fetch. */
export function resolveAssetUrl(ref: AssetRef): string {
  const trimmed = ref.trim();
  if (/^https?:\/\//i.test(trimmed)) return normaliseExternal(trimmed);

  const key = trimmed.replace(/^\/+/, '');
  switch (ASSET_PROVIDER) {
    case 'r2':
      return `${R2_PUBLIC_BASE}/${key}`;
    case 'drive':
      // Under Drive, a bare key is treated as a file id.
      return driveDirectUrl(key);
  }
}

/** Best-effort filename, for `download` attributes and link labels. */
export function assetFileName(ref: AssetRef): string {
  const withoutQuery = ref.split(/[?#]/)[0] ?? ref;
  return decodeURIComponent(withoutQuery.split('/').filter(Boolean).pop() ?? 'download');
}
