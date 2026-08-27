import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Keystatic writes `null` or `""` for optional fields the editor left blank,
 * where zod's `.optional()` expects the key to be absent. These helpers bridge
 * that gap so a half-filled CMS entry fails on its own merits rather than on a
 * serialisation detail.
 */
const emptyToUndefined = (value: unknown) =>
  value === null || value === '' ? undefined : value;

const optionalUrl = z.preprocess(emptyToUndefined, z.url().optional());
const optionalText = z.preprocess(emptyToUndefined, z.string().min(1).optional());

/**
 * A reference to a heavy file held outside the repo (R2 today).
 * Either a bare key or a full URL — see src/lib/assets.ts.
 */
const optionalAssetRef = optionalText;

/**
 * The single source of truth for an artist's external presence.
 *
 * Nothing else in the codebase may hold an artist URL. Every rendered link
 * list reads from here, so a wrong handle is fixed in exactly one place.
 */
const links = z
  .object({
    spotify: optionalUrl,
    appleMusic: optionalUrl,
    bandcamp: optionalUrl,
    instagram: optionalUrl,
    youtube: optionalUrl,
    tiktok: optionalUrl,
    website: optionalUrl,
  })
  .default({});

export type ArtistLinks = z.infer<typeof links>;

/** ~100 words, counted rather than approximated by character length. */
const shortBio = z
  .string()
  .refine((value) => value.trim().split(/\s+/).filter(Boolean).length <= 100, {
    message: 'shortBio must be 100 words or fewer',
  });

const artists = defineCollection({
  loader: glob({ pattern: '**/*.mdoc', base: './src/content/artists' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      tagline: z.string(),
      shortBio,
      genres: z.array(z.string()).min(1),
      status: z.enum(['active', 'associate', 'archived']).default('active'),

      // Alt text is a required schema field, not an afterthought: an artist
      // cannot be published with an undescribed hero image. Photographer
      // credit is required for the same reason — crediting is contractual.
      heroImage: z.object({
        src: image(),
        alt: z.string().min(1),
        credit: z.string().min(1),
      }),

      pressShots: z
        .array(
          z.object({
            src: image(),
            alt: z.string().min(1),
            credit: z.string().min(1),
            /** Hi-res original for press and print use. */
            hiRes: optionalAssetRef,
          }),
        )
        .default([]),

      logo: z.preprocess(
        (value) =>
          value && typeof value === 'object' && 'src' in value && value.src
            ? value
            : undefined,
        z.object({ src: image(), alt: z.string().min(1) }).optional(),
      ),

      links,

      techRider: optionalAssetRef,
      stagePlot: optionalAssetRef,
      bookingTerritories: optionalText,

      featured: z.boolean().default(false),
      order: z.number().int().default(0),
    }),
  // longBio is the Markdoc body of the file, not a frontmatter field.
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.mdoc', base: './src/content/news' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      excerpt: z.string(),
      coverImage: z.object({
        src: image(),
        alt: z.string().min(1),
        credit: optionalText,
      }),
      relatedArtists: z.preprocess(
        (value) => (Array.isArray(value) ? value.filter(Boolean) : value),
        z.array(reference('artists')).default([]),
      ),
      /** Set when the piece itself lives elsewhere, e.g. a press pickup. */
      externalUrl: optionalUrl,
      draft: z.boolean().default(false),
    }),
  // body is the Markdoc body of the file.
});

/** Schema only for now — no UI is built against this yet. */
const liveDates = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: './src/content/live-dates' }),
  schema: z.object({
    artist: reference('artists'),
    date: z.coerce.date(),
    venue: z.string(),
    city: z.string(),
    country: z.string(),
    ticketUrl: optionalUrl,
    soldOut: z.boolean().default(false),
    festivalName: optionalText,
  }),
});

export const collections = { artists, news, liveDates };
