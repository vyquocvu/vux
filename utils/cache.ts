/**
 * Helpers to set sensible Cache-Control headers on per-request responses.
 *
 * Use `setCacheControl(res, ...)` from inside `getServerSideProps` for routes
 * that need explicit no-store or short-TTL semantics. For Pages Router
 * `getStaticProps` the cache TTL is controlled by the `revalidate` field of
 * the returned object — see individual pages for the values chosen.
 *
 * Notes on what Cloudflare does for us automatically:
 *   • HTML compression (Brotli/gzip) is on by default at the edge.
 *   • `s-maxage` is honoured by the CDN; `private` / `no-store` tells the CDN
 *     not to cache at all.
 *   • For ISR pages we additionally get a stale-while-revalidate window so
 *     requests stay fast during regeneration.
 */

export interface CacheOptions {
  /** Public or private cache (CDN behaviour). Defaults to "public". */
  scope?: "public" | "private";
  /** Browser-side max-age in seconds. */
  maxAge?: number;
  /** CDN-only TTL — `Cache-Control: s-maxage=N`. */
  sMaxAge?: number;
  /** Optional stale-while-revalidate window in seconds. */
  staleWhileRevalidate?: number;
  /** Set `no-store` to disable all caching. */
  noStore?: boolean;
  /** Optional Vary header (defaults to Vary: Accept-Encoding). */
  vary?: string[];
}

const DEFAULT_VARY = ["Accept-Encoding"];

export function setCacheControl(
  res: { setHeader: (name: string, value: string) => void },
  opts: CacheOptions = {},
): void {
  const parts: string[] = [];

  if (opts.noStore) {
    parts.push("private", "no-store", "max-age=0", "must-revalidate");
  } else {
    parts.push(opts.scope ?? "public");
    if (typeof opts.maxAge === "number") parts.push(`max-age=${opts.maxAge}`);
    if (typeof opts.sMaxAge === "number") {
      parts.push(`s-maxage=${opts.sMaxAge}`);
    } else if (opts.staleWhileRevalidate !== undefined) {
      // Without s-maxage, SWR has nothing to inherit from, so set both.
      parts.push("s-maxage=0");
    }
    if (typeof opts.staleWhileRevalidate === "number") {
      parts.push(`stale-while-revalidate=${opts.staleWhileRevalidate}`);
    }
    if (opts.noStore === false) {
      // default fall-through: nothing extra.
    }
  }

  const vary = (opts.vary ?? DEFAULT_VARY).filter(Boolean);
  res.setHeader("Vary", vary.join(", "));
  res.setHeader("Cache-Control", parts.join(", "));
}
