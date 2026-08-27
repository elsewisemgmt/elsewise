import { config, collection, fields } from '@keystatic/core';

/**
 * Image paths are stored relative to the entry file so Astro's `image()`
 * schema helper can resolve them and optimise them at build time. Entries
 * live at `src/content/<collection>/*.mdoc`, so the path back to
 * `src/assets/images/` is two levels up.
 */
const imageDirectory = (name: string) => ({
  directory: `src/assets/images/${name}`,
  publicPath: `../../assets/images/${name}/`,
});

/** Photographer credit is contractual, so it is required wherever a shot is. */
const creditField = fields.text({
  label: 'Photographer credit',
  description: 'Rendered wherever this shot appears. Required.',
  validation: { isRequired: true },
});

const altField = fields.text({
  label: 'Alt text',
  description: 'Describe the image for screen readers and search. Required.',
  validation: { isRequired: true },
});

/**
 * A named person reachable by email. The name becomes the visible link text
 * and the email becomes the mailto target, so both are needed for the link to
 * render at all — leave the name blank to omit the contact entirely.
 */
const contactField = (label: string, description: string) =>
  fields.object(
    {
      name: fields.text({ label: 'Name' }),
      email: fields.text({
        label: 'Email',
        description: 'The name is shown; this is where it links to.',
      }),
    },
    { label, description },
  );

/**
 * Heavy files (hi-res originals, riders, plots) are not committed to the repo.
 * Store either a bare key resolved against the R2 bucket, or a full URL.
 */
const assetRefField = (label: string, description: string) =>
  fields.text({
    label,
    description: `${description} Either a path in the files bucket (e.g. nova-halle/tech-rider.pdf) or a full URL.`,
  });

export default config({
  storage: {
    kind: 'github',
    repo: { owner: 'elsewisemgmt', name: 'elsewise' },
  },

  ui: {
    brand: { name: 'Elsewise' },
    navigation: {
      Roster: ['artists'],
      Publishing: ['news'],
      Live: ['liveDates'],
    },
  },

  collections: {
    artists: collection({
      label: 'Artists',
      slugField: 'name',
      path: 'src/content/artists/*',
      format: { contentField: 'longBio' },
      entryLayout: 'content',
      columns: ['name', 'status'],
      schema: {
        name: fields.slug({
          name: { label: 'Name', validation: { isRequired: true } },
          slug: { description: 'Used in the page URL: /artists/<slug>' },
        }),
        tagline: fields.text({
          label: 'Tagline',
          description: 'One line. Shown on the roster grid hover state.',
          validation: { isRequired: true },
        }),
        shortBio: fields.text({
          label: 'Short bio',
          multiline: true,
          description: '100 words maximum. Used in listings and press kits.',
          validation: { isRequired: true },
        }),
        longBio: fields.markdoc({ label: 'Long bio' }),
        genres: fields.array(fields.text({ label: 'Genre' }), {
          label: 'Genres',
          itemLabel: (props) => props.value,
          validation: { length: { min: 1 } },
        }),
        status: fields.select({
          label: 'Status',
          options: [
            { label: 'Active', value: 'active' },
            { label: 'Associate', value: 'associate' },
            { label: 'Archived', value: 'archived' },
          ],
          defaultValue: 'active',
        }),

        heroImage: fields.object(
          {
            src: fields.image({
              label: 'Hero image',
              ...imageDirectory('artists'),
              validation: { isRequired: true },
            }),
            alt: altField,
            credit: creditField,
          },
          { label: 'Hero image' },
        ),

        pressShots: fields.array(
          fields.object({
            src: fields.image({
              label: 'Press shot',
              ...imageDirectory('artists'),
              validation: { isRequired: true },
            }),
            alt: altField,
            credit: creditField,
            hiRes: assetRefField('Hi-res original', 'For press and print use.'),
          }),
          {
            label: 'Press shots',
            itemLabel: (props) => props.fields.credit.value || 'Press shot',
          },
        ),

        logo: fields.object(
          {
            src: fields.image({ label: 'Logo', ...imageDirectory('artists') }),
            alt: altField,
          },
          { label: 'Logo' },
        ),

        // Every artist link belongs here and nowhere else.
        links: fields.object(
          {
            spotify: fields.url({ label: 'Spotify' }),
            appleMusic: fields.url({ label: 'Apple Music' }),
            bandcamp: fields.url({ label: 'Bandcamp' }),
            instagram: fields.url({ label: 'Instagram' }),
            youtube: fields.url({ label: 'YouTube' }),
            tiktok: fields.url({ label: 'TikTok' }),
            website: fields.url({ label: 'Website' }),
          },
          {
            label: 'Links',
            description:
              'The only place an artist URL may live. Every link list on the site reads from here.',
          },
        ),

        manager: contactField(
          'Manager',
          'Shown on the roster hover state and on the artist page.',
        ),
        bookingAgent: contactField('Booking agent', 'Shown on the artist page.'),

        techRider: assetRefField('Tech rider', 'Sent to production managers.'),
        stagePlot: assetRefField('Stage plot', 'Sent to production managers.'),
        bookingTerritories: fields.text({
          label: 'Booking territories',
          description: 'e.g. Benelux, DE, UK',
        }),

        featured: fields.checkbox({ label: 'Featured', defaultValue: false }),
        order: fields.integer({
          label: 'Order',
          description: 'Lower numbers sort first on the roster.',
          defaultValue: 0,
        }),
      },
    }),

    news: collection({
      label: 'News',
      slugField: 'title',
      path: 'src/content/news/*',
      format: { contentField: 'body' },
      entryLayout: 'content',
      columns: ['title', 'date'],
      schema: {
        title: fields.slug({
          name: { label: 'Title', validation: { isRequired: true } },
          slug: { description: 'Used in the page URL: /news/<slug>' },
        }),
        date: fields.date({
          label: 'Date',
          validation: { isRequired: true },
          defaultValue: { kind: 'today' },
        }),
        excerpt: fields.text({
          label: 'Excerpt',
          multiline: true,
          validation: { isRequired: true },
        }),
        body: fields.markdoc({ label: 'Body' }),
        coverImage: fields.object(
          {
            src: fields.image({
              label: 'Cover image',
              ...imageDirectory('news'),
              validation: { isRequired: true },
            }),
            alt: altField,
            credit: fields.text({ label: 'Photographer credit' }),
          },
          { label: 'Cover image' },
        ),
        relatedArtists: fields.array(
          fields.relationship({ label: 'Artist', collection: 'artists' }),
          { label: 'Related artists', itemLabel: (props) => props.value ?? 'Artist' },
        ),
        externalUrl: fields.url({
          label: 'External URL',
          description: 'For press pickups that live on someone else’s site.',
        }),
        draft: fields.checkbox({ label: 'Draft', defaultValue: false }),
      },
    }),

    liveDates: collection({
      label: 'Live dates',
      slugField: 'label',
      path: 'src/content/live-dates/*',
      format: { data: 'yaml' },
      columns: ['label', 'date'],
      schema: {
        label: fields.slug({
          name: {
            label: 'Label',
            description: 'Internal reference, e.g. "Nova Halle at Paradiso".',
            validation: { isRequired: true },
          },
        }),
        artist: fields.relationship({
          label: 'Artist',
          collection: 'artists',
          validation: { isRequired: true },
        }),
        date: fields.date({ label: 'Date', validation: { isRequired: true } }),
        venue: fields.text({ label: 'Venue', validation: { isRequired: true } }),
        city: fields.text({ label: 'City', validation: { isRequired: true } }),
        country: fields.text({ label: 'Country', validation: { isRequired: true } }),
        ticketUrl: fields.url({ label: 'Ticket URL' }),
        soldOut: fields.checkbox({ label: 'Sold out', defaultValue: false }),
        festivalName: fields.text({ label: 'Festival name' }),
      },
    }),
  },
});
