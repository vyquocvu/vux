---
name: verify
description: Run a real local smoke verification of the Vux Next.js + Cloudflare (D1/R2) blog using headless Chrome over CDP and direct HTTP/API checks, then cleanly tear down all spawned processes.
---

# Vux Smoke Verification Skill (`/verify`)

Use this skill after any code or seed change to prove the application boots, renders real pages in headless Chrome, serves R2 media with byte-range/cache headers, and enforces API auth/validation boundaries.

> **Protected Check Rule:** Never edit this file or `scripts/verify-smoke.ts` to weaken assertions or work around a failing check. Fix the underlying application or seed issue instead.

## Prerequisites

1. Local D1 and R2 have been migrated and seeded at least once:
   ```sh
   yarn db:migrate:local
   yarn db:seed:local
   ```
2. Google Chrome is installed at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` (or set `CHROME_PATH`).

## Step 1: Fast Static Checks

Run typecheck, ESLint, and the TOC corpus invariant check before starting a browser:

```sh
npx tsc --noEmit && yarn lint && node --experimental-strip-types scripts/toc-check.ts
```

**Pass criteria:** Exit code `0`, zero TypeScript errors, zero ESLint warnings/errors, and `toc-check.ts` prints `OK posts=...`.

## Step 2: Boot, Run Main Flows, Observe, and Teardown

Run the self-contained harness:

```sh
node --experimental-strip-types scripts/verify-smoke.ts
```

What the harness executes:
1. **Startup (isolated):** Allocates two free ephemeral loopback ports on `127.0.0.1` — one for `yarn dev -p <port>` (with `initOpenNextCloudflareForDev()` binding local D1/R2) and one for headless Chrome CDP (`--user-data-dir` in a fresh temp directory). Polls `GET /api/auth/me` until HTTP `200` (no fixed sleep).
2. **Home Feed (`browser:home-feed`):** Opens `/` at `1440x900` (`prefers-color-scheme: light`), waits for `.feed article`, asserts `articles >= 1`, valid `/post/<slug>.<uid>` links, `naturalWidth > 0` on loaded images, zero uncaught page exceptions, zero non-deprecation `console.error`s, and zero same-origin HTTP `>= 400` responses.
3. **Article & Reading Rail (`browser:post-detail-and-rail`):** Navigates to the first article from the feed, waits for `.post-title`, `.post-content`, and hydrated comments, asserts desktop reading rail (`aside`) visibility, every TOC anchor `#id` resolves to an element in the DOM, `ClapButton` is mounted, loaded images have `naturalWidth > 0`, and zero page/network/console errors.
4. **Public Routes (`http:public-routes`):** Fetches `/tags`, `/about`, `/contact`, `/login`, `/signup`, `/post` and asserts HTTP `200` with non-empty HTML.
5. **Media Edge Middleware (`http:media-middleware-r2`):** Fetches a discovered `/images/*` asset and asserts:
   - `200` with `Cache-Control: ...immutable`
   - `Range: bytes=0-15` returns `206` with matching `Content-Range` and exact 16 bytes
   - Out-of-bounds `Range` returns `416`
   - Invalid traversal key (`/images/bad..key.png`) returns `400`
   - Missing valid key (`/images/smoke-missing-000.webp`) returns `404`
   - `If-None-Match` with returned `ETag` returns `304`
6. **Auth & Post API Boundaries (`http:api-auth-and-post-endpoints`):**
   - `GET /api/auth/me` -> `200` (`{"authUser":null}`)
   - `GET /api/admin/posts` (unauth) -> `403`
   - `POST /api/upload?path=images/smoke.webp` (unauth) -> `403`
   - `GET /api/posts/<uid>/claps` -> `200` with numeric `count`
   - `GET /api/posts/<uid>/comments` -> `200` with array `comments`
   - `POST /api/posts/<uid>/comments` (unauth) -> `401`
7. **Teardown & Cleanup:** On completion or signal (`SIGINT`/`SIGTERM`), closes CDP WebSocket, terminates both `chrome` and `next dev` process groups (`SIGTERM`, then `SIGKILL` if needed), and removes the temporary Chrome profile directory.

## Pass / Fail Criteria & Evidence

- **PASS:** All 6 checks print `PASS <name> (<ms>) — <evidence>` and `[verify] summary: 6/6 passed, 0 failed in <ms>` with exit code `0`.
- **FAIL:** Any check prints `FAIL <name>` with assertion details, exits with code `1`, and dumps the tail of `next dev` server logs.
- **Evidence to report:** Paste the exact stdout summary lines from Step 1 and Step 2 (never claim pass without running both after the final edit).

## Anti-Flake & Cleanup Verification

If a run leaves an unexpected listener or fails intermittently, inspect processes (`pgrep -fl "next-server|Google Chrome"`) and diagnose the root cause — never add `sleep` or retry loops to mask flakiness.
