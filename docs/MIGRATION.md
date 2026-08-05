# Migrating the Vux blog from Vercel → Cloudflare

This doc captures everything that changed and how to ship it.

## TL;DR

| Old (Vercel) | New (Cloudflare) |
|---|---|
| Next.js 13 + Firebase Auth + Firestore + Storage | Next.js 14 (Pages Router) on Cloudflare Workers via `@opennextjs/cloudflare` |
| `firebase-admin` for token verification | D1 `users` table + iron-webcrypto-signed cookies |
| Firestore `posts` collection | D1 `posts` table + `tags` join |
| Firebase Storage for media | Cloudflare R2 bucket `vux-media`, served via a Worker middleware |
| `cookie-session` (Node `crypto.createHmac`) | Web Crypto AES-GCM + HMAC via `iron-webcrypto` |

## What still works

- All 47 existing posts: slug pattern `{friendlyStr(title)}.{uid}` preserved so old
  inbound links (`/post/van-de-debug-...k4JFYIfqXfAtnl3eoRFQ`) keep resolving.
- ISR (`revalidate: 60` on `/post/[slug]`).
- `getStaticProps` (homepage, post page, sitemap.xml).
- Markdown authoring via the existing Quill.js admin editor.
- `next/image` with `unoptimized: true` (no Cloudflare Images billing required).

## What is intentionally **not** the same

- **Image-domain allowlist** is unchanged (still `avatars.githubusercontent.com`).
- **Tailwind, gtag, GTM** are still wired up.
- The previously-stubbed `/signup` page is now a real form.
- Posts are no longer written to Firebase; the admin's `create / edit / delete`
  endpoints (`/api/auth/*`, `fetcher/post.ts`) hit D1.

## File map

```
.
├── open-next.config.ts          # OpenNext adapter (cache, no R2 public asset)
├── wrangler.jsonc               # Worker config (DB, MEDIA bindings, vars)
├── middleware.ts                # Serves /images/* and /audios/* from R2
├── scripts/
│   ├── crawl.py                 # One-time crawls vyquocvu.com → seeds/posts.json + seeds/images/
│   └── seed.ts                  # Loads seeds/ into wrangler D1 + R2 (local or remote)
├── seeds/
│   ├── schema.sql               # DDL: users, sessions, posts, tags
│   ├── posts.json               # 47 crawled posts (uid, slug, title, content, …)
│   └── images/                  # 94 images (4.4 MB)
├── pages/
│   ├── api/auth/{login,logout,signup,me}.ts
│   ├── api/upload.ts            # POST /api/upload?path=images/<key>  (auth-gated)
│   ├── login.tsx, signup.tsx    # Real email/password forms
│   ├── _document.tsx            # Dropped the Firebase auth JSON blob
│   └── _app.tsx, admin/*        # Unchanged
├── components/, contexts/, styles/   # Unchanged
├── utils/
│   ├── auth/{d1,password,session,user,logout,hooks}.{ts,tsx}
│   ├── upload.ts                # Browser-side helper: POSTs to /api/upload
│   ├── common.ts                # Updated timeFromNow() to take a number
│   └── apiEdge.ts               # bodyParser:false config helper
├── fetcher/post.ts              # D1 queries (replaces Firestore reads)
├── interfaces/Post.ts           # Post: createdAt/updatedAt are now unix seconds
├── tsconfig.json                # Adds @cloudflare/workers-types, es2022 lib
└── cloudflare-env.d.ts          # Declares DB, MEDIA, ASSETS, NEXT_PUBLIC_SITE_URL…
```

## What you need on the Cloudflare side

1. A Cloudflare account with Workers enabled.
2. (One-time) Create the D1 database:

   ```sh
   npx wrangler d1 create vux
   ```

   Paste the resulting `database_id` into `wrangler.jsonc` (replacing
   `REPLACE_WITH_D1_ID`).

3. (One-time) Create the R2 bucket:

   ```sh
   npx wrangler r2 bucket create vux-media
   ```

4. Set the session secret (must be ≥ 32 chars):

   ```sh
   npx wrangler secret put SESSION_PASSWORD
   # paste a random 32+ char string, e.g. output of `openssl rand -base64 48`
   ```

## Deploy

```sh
# 1. Install deps
npm install --legacy-peer-deps

# 2. Build and adapt for Cloudflare
npm run build:opennext

# 3. Apply D1 schema + seed posts + upload images to remote
npm run db:migrate:remote
npm run db:seed:remote      # ~94 R2 uploads, takes a couple minutes

# 4. Deploy the Worker
npm run deploy
```

First run `npm run preview` to confirm everything locally under `workerd`:

```sh
npm run db:migrate:local
npm run db:seed:local
npm run preview   # http://localhost:8787
```

## Auth model

- Sign-up: `POST /api/auth/signup` (email, password, displayName) — hashes the
  password with PBKDF2-SHA-256 (600 000 iterations) and creates a row in
  `users`. If the email matches `OWNER_EMAIL`, `is_admin = 1`.
- Login: `POST /api/auth/login` — verifies PBKDF2 hash, sets `vux_session`
  cookie (HttpOnly, SameSite=Lax, Secure in prod).
- Logout: `POST /api/auth/logout` — clears the cookie.
- Session check: `GET /api/auth/me` — returns the current user or `{authUser:null}`.
- Cookie is sealed with `iron-webcrypto` (AES-256-CBC + HMAC-SHA-256) using a
  PBKDF2-derived key from `SESSION_PASSWORD`.

### The first admin

The first time you sign up **with the address in `OWNER_EMAIL`** you become
admin. Then disable sign-up by either:
- deleting the user-facing signup link from `pages/login.tsx`, or
- swapping `/api/auth/signup` for a `403` if `users` already has ≥ 1 admin row.

## Verifying a remote seed

After `npm run db:seed:remote`, two checks confirm the data landed:

1. Posts in D1 (authoritative):
   ```sh
   npx wrangler d1 execute vux --remote --command "SELECT COUNT(*) AS n FROM posts"
   ```

2. Images in R2 — the public `r2.dev` URL is **eventually consistent**, so curl
   spot-checks can show 404 for a few minutes after upload. Either:
   - wait 60–120 s and re-poll, or
   - use `wrangler r2 object get vux-media/images/<key> --remote > /tmp/x.webp` and then `file /tmp/x.webp`.

A typical seed run took ~3 minutes for 94 files (one spawn per upload). See
`scripts/verify-remote.ts` for more.

## Known TODOs

- **Upload route** (`pages/api/upload.ts`): reading the multipart body in
  OpenNext's Pages Router adapter needs `req.request` to expose the underlying
  Web Request. Until that's wired, the editor's "Insert image" button won't
  upload files through the browser. Workaround: drop images into R2 via
  `wrangler r2 object put vux-media/images/<key> --file=path/to/img.webp` and
  reference them directly in the Quill HTML.
- **Non-admin gating on admin pages**: today's `getInitialProps` only checks
  for *a* session, not `isAdmin`. Open `/pages/admin/index.tsx` and add a
  redirect on `!ctx.myCustomData.AuthUserInfo.AuthUser?.isAdmin`.
- **Tags**: `seeds/posts.json` has empty `tags` for every post (the live blog
  doesn't use them). The schema and fetcher both support them; you'll need to
  run `npm run db:seed:remote` again after adding tags.
- **Exact timestamps**: the crawler only has the relative "8 months ago"
  string. The seed loader backfills `created_at` / `updated_at` by parsing
  those labels. If you want exact timestamps, dump them out of Firestore
  directly and re-seed.

## Rollback

Vercel can keep running in parallel until you've confirmed Cloudflare is
behaving. Once the DNS is pointed at Cloudflare, Vercel still owns the
canonical data in Firestore. Cloudflare is the *target*; Vercel is still
authoritative. Use the Cloudflare dashboard to delete the Worker if you need
to revert quickly.

## Cache strategy

The site is layered behind three independent caches; the right-most one runs first.

| Layer | Scope | Where | Hit rate |
|---|---|---|---|
| **Cloudflare CDN** | HTML & assets | Cloudflare POPs (300+ worldwide) | future — needs Cache Rules or `cf-cache-status` enablement |
| **Workers Cache API** (OpenNext `enableCacheInterception`) | ISR pages per build-id | per-isolate, per-COLO | HIT today; `x-nextjs-cache: HIT` on warm cache |
| **Browser cache** | static assets | User's browser | once per version bump |

### Cache-Control policy

| Path | `Cache-Control` | Reason |
|---|---|---|
| `/` | `s-maxage=120, swr=30d` | Homepage list refreshes every 2 min; long stale tail keeps it punchy. |
| `/about`, `/contact`, `/projects` | `s-maxage=3600, swr=30d` | Static content, hour-long freshness, 1-day-after-stale window. |
| `/tags` | `s-maxage=300, swr=30d` | Tag count comes from D1; 5 min revalidate. |
| `/post/[slug]` | `s-maxage=600, swr=30d` | Posts are read-mostly; admin edits land within 10 min. |
| `/sitemap.xml` | `public, s-maxage=600, swr=86400` | Search engines re-crawl hourly is plenty. |
| `/images/*`, `/audios/*` | `public, max-age=31536000, immutable` | Content-addressed; CDN + browser cache the same forever. |
| `/admin/*`, `/login`, `/signup` | `private, no-store` | Session-specific; never CDN-cached. |
| `/api/*` | `private, no-store` | Same — no API endpoint is safe to cache. |
| `/post?tag=*` | `private, no-cache, no-store` | Filter params trigger SSR. |

### Other levers

- **`placement: { mode: "smart" }`** in `wrangler.jsonc` routes the request to the COLO with the lowest latency for repeat visitors. Confirmed live: `cf-placement: local-SIN`.
- **Brotli compression** runs at the edge by default. Confirmed: `content-encoding: br`. HTML for `/about` shrunk from 9,958 → ~2 KB.
- **`Set-Vary: Accept-Encoding`** (default) keeps CDNs from serving the wrong-encoding version.
- **Smart compression** lets us drop a separate gzip server, since Cloudflare handles it.

### Putting images on R2's public CDN (optional)

R2's public r2.dev URL serves `/images/*` straight from Cloudflare's edge with no Worker invocation. If you want sub-50 ms image loads globally:

```sh
npx wrangler r2 bucket dev-url enable vux-media
# Returns: https://pub-<hex>.r2.dev
```

Then bulk-rewrite HTML to use `https://pub-<hex>.r2.dev/images/...` instead of `/images/...`. You'll need a custom domain like `media.vyquocvu.com` for a clean redirect from the worker, otherwise requests still hit the worker middleware. Decide based on how much worker CPU you'd save.

### CDN-level cache activation

To get `cf-cache-status: HIT` (Cloudflare's CDN instead of the Worker Cache API), add Cache Rules in the Cloudflare dashboard:

- **Custom Filter Expression:** `http.request.full_uri eq "https://vux.vyquocvu.workers.dev/"` (or a similar pattern)
- **Eligible for cache:** on
- **Edge TTL:** 120 (matches ISR)

That gives you true edge-cache HIT/MISS without round-tripping through the Worker, dropping p99 latency from ~250 ms to <50 ms for cached HTML.
