import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * The single source of truth for an artist's external presence.
 *
 * Nothing else in the codebase may hold an artist URL. Every rendered link
 * list reads from here, so a wrong handle is fixed in exactly one place.
 */
const links = z
  .object({
    spotify: z.url().optional(),
    appleMusic: z.url().optional(),
    bandcamp: z.url().optional(),
    instagram: z.url().optional(),
    youtube: z.url().optional(),
    tiktok: z.url().optional(),
    website: z.url().optional(),
  })
  .default({});

export type ArtistLinks = z.infer<typeof links>;

/**
 * A reference to a heavy file held outside the repo (R2 today).
 * Either a bare key or a full URL — see src/lib/assets.ts.
 */
const assetRef = z.string().min(1);

/** ~100 words, counted rather than guessed at by character length. */
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
      // cannot be published with an undescribed hero image.
      heroImage: z.object({
        src: image(),
        alt: z.string().min(1),
        // Photographer credit is a contractual obligation. Required, and
        // rendered wherever the shot appears.
        credit: z.string().min(1),
      }),

      pressShots: z
        .array(
          z.object({
            src: image(),
            alt: z.string().min(1),
            credit: z.string().min(1),
            /** Hi-res original for press and print use. */
            hiRes: assetRef.optional(),
          }),
        )
        .default([]),

      logo: z
        .object({
          src: image(),
          alt: z.string().min(1),
        })
        .optional(),

      links,

      techRider: assetRef.optional(),
      stagePlot: assetRef.optional(),
      bookingTerritories: z.string().optional(),

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
        credit: z.string().optional(),
      }),
      relatedArtists: z.array(reference('artists')).default([]),
      /** Set when the piece itself lives elsewhere, e.g. a press pickup. */
      externalUrl: z.url().optional(),
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
    ticketUrl: z.url().optional(),
    soldOut: z.boolean().default(false),
    festivalName: z.string().optional(),
  }),
});

export const collections = { artists, news, liveDates };
