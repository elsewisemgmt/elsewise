# Elsewise

Roster and portfolio site for Elsewise, a future-forward management agency
based in Amsterdam. The site exists to make the roster legible to promoters,
press, festivals and sync supervisors, and to publish news about the acts.

- **Live (staging):** https://elsewise.cedric-c3e.workers.dev
- **Production domain:** elsewisemgmt.com — *DNS not yet configured*
- **CMS:** `/keystatic` — *requires the GitHub App setup below*

---

## Stack

| Piece | Choice | Why |
| --- | --- | --- |
| Framework | Astro 7, static output, TypeScript (strict) | Ships zero JS on public pages by default |
| CMS | Keystatic, GitHub storage mode | Editors commit to the repo; no database, no vendor lock |
| Host | Cloudflare Workers with static assets | Not Pages — Cloudflare points new projects at Workers |
| Type | Archivo, self-hosted via Fontsource | No requests to Google |
| React | Admin route only | The Keystatic UI needs it; nothing public does |

### Why this is not a pure static build

Keystatic's GitHub mode needs two server routes: the admin UI and the GitHub
App OAuth handshake. The Keystatic integration injects both with
`prerender: false`, so they run on the Worker while **every public page stays
prerendered** and is served from static assets.

```
/                            prerendered file
/artists/[slug]              prerendered file
/news/[slug]                 prerendered file
/about                       prerendered file
/keystatic/[...params]       Worker  (React, admin only)
/api/keystatic/[...params]   Worker  (OAuth + commits)
```

The built homepage contains **no `<script>` tags**. React ships only in the
chunks the admin route loads.

---

## Running locally

```bash
npm install
npm run dev          # http://127.0.0.1:4321
```

Other commands:

```bash
npm run check           # typecheck .astro and .ts files
npm run build           # production build into dist/
npm run preview         # preview the static build (Astro's own server)
npm run preview:worker  # build, then serve through the real Worker runtime
npm run deploy          # build and deploy to Cloudflare
```

Use `preview:worker` rather than `preview` when you need to check anything
that touches the Worker — the Keystatic routes, headers, or redirects.

---

## Deploying

Deploys happen automatically: **push to `main` and Cloudflare rebuilds**, which
is what makes Keystatic's GitHub mode worth having. An editor saving a post
commits to the repo, which triggers a build, and the change is live in a couple
of minutes with no developer involved.

To deploy by hand (useful when debugging the build):

```bash
npm run deploy
```

### One-time setup still outstanding

These need doing in dashboards and cannot be scripted from here:

1. **Connect Workers Builds.** Cloudflare dashboard → Workers & Pages →
   `elsewise` → Settings → Builds → connect the `elsewisemgmt/elsewise` repo.
   Build command `npm run build`, deploy command `npx wrangler deploy`.
2. **Set the Keystatic secrets** (see below).
3. **Point the domain.** Add `elsewisemgmt.com` as a zone in Cloudflare, then
   add it as a custom domain on the Worker. Until then the site is on
   `elsewise.cedric-c3e.workers.dev`.
4. **Enable R2, then create the bucket.** R2 is not yet enabled on the
   account — `wrangler r2 bucket create` returns code 10042 until it is
   switched on in the dashboard. Then create `elsewise-files` and map it to
   `files.elsewisemgmt.com`, which is the base URL heavy assets resolve
   against. Nothing on the site breaks meanwhile; only the hi-res and
   production-document links 404.

---

## Adding content

Go to `/keystatic` and sign in with GitHub. Saving writes a commit to the repo,
which triggers a rebuild.

To edit locally instead, run `npm run dev` and open
`http://127.0.0.1:4321/keystatic`.

### Artists

Everything is editable in Keystatic. Two fields are enforced by the schema
rather than by convention, and the build **fails** without them:

- **Alt text** on every image. An artist cannot be published with an
  undescribed hero image.
- **Photographer credit** on the hero image and every press shot. Crediting is
  a contractual obligation, so the credit is required and is rendered wherever
  the shot appears.

Two more rules worth knowing:

- **Every artist link belongs in the `links` object and nowhere else.** Every
  rendered link list on the site reads from it, so a wrong handle is fixed in
  one place. Do not put URLs in the bio.
- **`shortBio` is capped at 100 words**, counted rather than approximated by
  character length. Longer copy belongs in the long bio, which is the body of
  the entry and has no limit.

### News

`relatedArtists` is a real content-collection reference, so a typo in an
artist slug fails the build instead of rendering a dead link. Set
`externalUrl` when the piece lives on someone else's site and this entry is
only a pointer to it. `draft: true` posts are visible in `npm run dev` and are
never published.

### Live dates

The schema exists and validates, but **nothing renders it yet**. Entries added
now will be picked up when the live dates UI is built.

---

## Images and heavy files

Two separate paths, deliberately:

**Display images** live in `src/assets/images/` and are committed. Astro
optimises them at build time into responsive AVIF and WebP; no raw press shot
is ever served at full resolution. Always use `<Picture>` with `widths` and
`sizes`.

**Heavy files** — hi-res originals, tech riders, stage plots — are *not*
committed. They live in an R2 bucket and the CMS stores a reference:

- a bare key, e.g. `nova-halle/tech-rider.pdf`, resolved against the bucket
- or a full URL, which is passed through

`src/lib/assets.ts` is the only place that turns a reference into a URL.

### Pivoting to Google Drive

The foundation is laid but not built out. To switch:

1. Set `ASSET_PROVIDER = 'drive'` in `src/lib/assets.ts`.
2. Flesh out `driveDirectUrl`. Serving files through a Worker route would let
   them stay private; the current one-liner assumes public files.

No schema change and no content migration — entries already storing a full URL
keep working, and Drive *share* links are normalised to direct-download links
already.

---

## Keystatic GitHub App

Not yet created. Keystatic generates it for you:

1. `npm run dev`, open `/keystatic`, click **Sign in with GitHub**.
2. Follow the prompts to create the App against `elsewisemgmt/elsewise`.
3. Keystatic prints four values. Copy `.env.example` to `.env` and fill them in.
4. Add the App's callback URLs for every origin you use it from —
   `http://127.0.0.1:4321`, the `workers.dev` URL, and later `elsewisemgmt.com`.
   A missing callback URL is the cause of `redirect_uri not associated`.

For production, three are secrets and one is not:

```bash
npx wrangler secret put KEYSTATIC_GITHUB_CLIENT_ID
npx wrangler secret put KEYSTATIC_GITHUB_CLIENT_SECRET
npx wrangler secret put KEYSTATIC_SECRET
```

`PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` is inlined into the admin bundle at build
time, so it must be set as a **build-time** variable in the Workers Builds
settings, not as a secret.

---

## Project structure

```
src/
  assets/images/      committed display images, optimised at build
  components/         ArtistCard, ArtistLinks
  content/            artists/*.mdoc  news/*.mdoc  live-dates/*.yaml
  content.config.ts   zod schemas — the contract for all content
  layouts/            BaseLayout
  lib/assets.ts       heavy-file URL resolution (R2 today)
  pages/              routes
  scripts/reveal.ts   scroll reveal, dependency-free
  styles/global.css   design tokens and the type scale
keystatic.config.ts   CMS schema, mirrors content.config.ts
wrangler.jsonc        Worker + static assets config
```

Content is defined **twice**, in `content.config.ts` (zod, validates the build)
and `keystatic.config.ts` (the editing UI). They must be changed together —
Keystatic decides what an editor can enter, zod decides what the site accepts.

---

## Accessibility

Not a later pass:

- Semantic HTML; the roster is `<article>` elements, not clickable `<div>`s.
- Alt text is a required schema field, enforced at build.
- Hover-revealed information is visible on touch and mirrored on
  `:focus-within`, so hover is never the only route to it.
- `:focus-visible` is styled, never removed. There is a skip link.
- `prefers-reduced-motion` opts out of reveal animations entirely.
- Content stays visible when JS does not run.

---

## Not built yet

Roster grid styling, artist page design, press kits, live dates UI, contact
form routing, SEO and schema.org markup, Bandsintown or Notion integrations.
There is no analytics and there are no third-party scripts.
