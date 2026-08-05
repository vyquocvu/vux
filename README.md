# Vux — Cloudflare-Ready Next.js Blog

A personal blog built on Next.js 14 (Pages Router) running on Cloudflare Workers
via [`@opennextjs/cloudflare`]. Posts live in Cloudflare D1; images & audio live
in Cloudflare R2. Authentication uses email + password with PBKDF2 hashing and
Web-Crypto-signed cookies.

![Screenshot](/public//git/screenshot.png)

## Migrating from Vercel

This repository was previously deployed on Vercel using Next.js 13 + Firebase
(Auth + Firestore + Storage). The full migration notes — including how to
create the D1 database, R2 bucket, and the secret — live in
[`docs/MIGRATION.md`](./docs/MIGRATION.md). Seed data was crawled from
<https://www.vyquocvu.com/> into [`./seeds/`](./seeds/) (47 posts, 94 images).

## Stack

| Layer | Technology |
|---|---|
| Edge runtime | Cloudflare Workers (`@opennextjs/cloudflare`) |
| Framework | Next.js 14.2 (Pages Router) |
| Database | Cloudflare D1 (`posts`, `users`, `tags`, `sessions`) |
| Object storage | Cloudflare R2 (`vux-media`) |
| Auth | PBKDF2 (Web Crypto) + [`iron-webcrypto`](https://github.com/vadimdemedes/iron-webcrypto) cookies |
| Styling | Tailwind, `next/font/google` |
| Editor | Quill.js (unchanged) |
| ISR | `revalidate: 60` on `/post/[slug]` via Workers Cache API |

## Local development

```sh
npm install --legacy-peer-deps
npm run db:migrate:local
npm run db:seed:local      # one-time, ~94 image uploads
npm run preview            # builds, then starts wrangler dev on http://localhost:8787
```

Or, for fast iteration with the regular Next dev server (no worker bindings —
the auth flow won't work, but routing/CSS do):

```sh
npm run dev
```

## Deploy

```sh
# Provision once
npx wrangler d1 create vux
npx wrangler r2 bucket create vux-media
npx wrangler secret put SESSION_PASSWORD

# Migrate + deploy
npm run db:migrate:remote
npm run db:seed:remote
npm run deploy
```

`npm run deploy` is `opennextjs-cloudflare build && opennextjs-cloudflare deploy`
which produces a single Workers bundle from this directory.

## Scripts

| Script | Purpose |
|---|---|
| `npm run build` | `next build` — produces the OpenNext-readable output |
| `npm run dev` | Local Next dev server (no D1, no R2) |
| `npm run preview` | Build for Workers and serve via `wrangler dev` (real bindings) |
| `npm run deploy` | Build + `wrangler deploy` |
| `npm run db:migrate:local` | Apply `seeds/schema.sql` to local D1 |
| `npm run db:migrate:remote` | Same, against the remote D1 |
| `npm run db:seed:local` | Load `seeds/posts.json` into local D1 + R2 |
| `npm run db:seed:remote` | Same, against remote D1 + R2 |
| `npm run cf-typegen` | Regenerate `cloudflare-env.d.ts` from `wrangler.jsonc` |

## File map

- [`docs/MIGRATION.md`](./docs/MIGRATION.md) — migration notes from Vercel
- [`seeds/`](./seeds/) — crawled post data, images, schema
- [`middleware.ts`](./middleware.ts) — serves `/images/*` + `/audios/*` from R2
- [`open-next.config.ts`](./open-next.config.ts) — OpenNext adapter config
- [`wrangler.jsonc`](./wrangler.jsonc) — Worker bindings (D1 + R2)
- `pages/api/auth/*` — login, signup, logout, me
- `pages/api/upload.ts` — POST /api/upload?path=images/<key> (TODO: needs Web Request plumbing)
- `utils/auth/{d1,password,session}.ts` — D1 helpers, PBKDF2, iron-webcrypto sessions

## To regenerate the seeds

```sh
# Re-crawl https://www.vyquocvu.com to refresh `seeds/posts.json` + `seeds/images/`
python3 scripts/crawl.py

# Reload into local or remote D1 + R2
npm run db:seed:local    # or db:seed:remote
```

The crawler URL is hard-coded in `scripts/crawl.py` — change `BASE` if needed.
