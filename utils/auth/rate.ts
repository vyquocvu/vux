import type { NextApiRequest } from "next";

const enc = new TextEncoder();

export const requestIp = (req: NextApiRequest): string => {
  // Cloudflare overwrites this header. X-Forwarded-For is client-controlled
  // (the first hop can be anything), so it must not mint a fresh rate-limit bucket.
  const cf = req.headers["cf-connecting-ip"];
  const value = Array.isArray(cf) ? cf[0] : cf;
  if (typeof value === "string") {
    const ip = value.split(",")[0]?.trim() ?? "";
    if (ip && !ip.includes(" ")) return ip;
  }
  return "unknown";
};

export const clientHash = async (secret: string, ip: string): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(`${secret}\n${ip}`));
  const bytes = new Uint8Array(digest);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, "0");
  return hex.slice(0, 32);
};

/**
 * Fixed window counter in one statement, so parallel requests cannot all
 * pass a read-then-increment check. Returns true when this call was not recorded.
 */
export const isRateLimited = async (
  env: CloudflareEnv,
  bucket: string,
  max: number,
  windowSeconds: number,
): Promise<boolean> => {
  const now = Math.floor(Date.now() / 1000);
  const result = await env.DB
    .prepare(
      `INSERT INTO auth_attempts (bucket, count, window_start) VALUES (?1, 1, ?2)
       ON CONFLICT(bucket) DO UPDATE SET
         count = CASE
           WHEN (?2 - auth_attempts.window_start) >= ?3 THEN 1
           ELSE count + 1
         END,
         window_start = CASE
           WHEN (?2 - auth_attempts.window_start) >= ?3 THEN ?2
           ELSE window_start
         END
       WHERE (?2 - auth_attempts.window_start) >= ?3 OR count < ?4`,
    )
    .bind(bucket, now, windowSeconds, max)
    .run();
  return (result.meta?.changes ?? 0) < 1;
};

export const clearRateLimit = async (env: CloudflareEnv, bucket: string): Promise<void> => {
  await env.DB.prepare("DELETE FROM auth_attempts WHERE bucket = ?1").bind(bucket).run();
};
