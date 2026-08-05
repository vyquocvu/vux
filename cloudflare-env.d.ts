// Hand-written stub. Run `npm run cf-typegen` once the D1 database and R2
// bucket exist so wrangler rewrites this with the real IDs.

import "@opennextjs/cloudflare";

declare global {
  interface CloudflareEnv {
    /** D1 database — replaces Firestore. */
    DB: D1Database;
    /** R2 bucket holding `/images/<key>` and `/audios/<key>` uploads. */
    MEDIA: R2Bucket;
    /** Static assets produced by the OpenNext build. */
    ASSETS: Fetcher;
    /** Non-secret runtime config. */
    NEXT_PUBLIC_SITE_URL: string;
    OWNER_EMAIL: string;
    /** iron-session secret. Set with `wrangler secret put SESSION_PASSWORD`. */
    SESSION_PASSWORD: string;
  }
}

export {};
