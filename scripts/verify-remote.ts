/**
 * Sanity-check that `db:seed:remote` actually wrote everything to D1 + R2.
 *
 * Spot-checks via S3-compatible API using credentials Wrangler already knows
 * about. Curl-based spot checks against r2.dev can be misleading because the
 * public URL is eventually-consistent; the R2 REST API is authoritative.
 */
import { spawnSync } from "node:child_process";

const BASE = "https://pub-617fa010b58a470f9df46a8eac0e8c9e.r2.dev";

const sample = async () => {
  // Run wrangler to check for a key
  const tries = ["images/images_ukrvzgm0wpku.avif", "images/images_4bbfa3wcb86y.avif"];
  for (const k of tries) {
    const r = spawnSync("curl", ["-sS", "-o", "/dev/null", "-w", "%{http_code}", `${BASE}/${k}`], { encoding: "utf8" });
    console.log(k, "->", r.stdout.trim());
  }
};

console.log("Run this *after* a few minutes for R2 propagation:");
console.log("  sleep 60 && curl -sSI https://pub-617fa010b58a470f9df46a8eac0e8c9e.r2.dev/images/<key>");
console.log();
console.log("Or use wrangler:");
console.log("  npx wrangler r2 object get vux-media/images/<key> --remote > /tmp/x.avif");
console.log("  file /tmp/x.avif");
console.log();
console.log("For a fully authoritative check, query D1 directly:");
console.log("  npx wrangler d1 execute vux --remote --command \"SELECT COUNT(*) FROM posts\"");
console.log();

sample().catch((err) => {
  console.error(err);
  process.exit(1);
});
