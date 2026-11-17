import type { NextApiRequest, NextApiResponse } from "next";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getClapCount, incrementClap, publishedPostExists } from "fetcher/comments";
import { clientHash, requestIp } from "utils/auth/rate";

const MAX_CLAPS_PER_CLIENT = 50;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");

  const { uid } = req.query;
  if (typeof uid !== "string" || !uid) {
    return res.status(400).json({ error: "Invalid uid" });
  }

  try {
    if (req.method === "GET") {
      const count = await getClapCount(uid);
      return res.status(200).json({ count });
    }

    if (req.method === "POST") {
      if (!(await publishedPostExists(uid))) {
        return res.status(404).json({ error: "Not found" });
      }

      const { env } = await getCloudflareContext({ async: true });
      const ipHash = await clientHash(env.SESSION_PASSWORD, requestIp(req));
      const limited = await env.DB
        .prepare(
          `INSERT INTO clap_limits (post_uid, ip_hash, count) VALUES (?1, ?2, 1)
           ON CONFLICT(post_uid, ip_hash) DO UPDATE SET count = count + 1
           WHERE clap_limits.count < ?3`,
        )
        .bind(uid, ipHash, MAX_CLAPS_PER_CLIENT)
        .run();
      if ((limited.meta?.changes ?? 0) < 1) {
        return res.status(429).json({ error: "Clap limit reached", count: await getClapCount(uid) });
      }

      try {
        const count = await incrementClap(uid);
        return res.status(200).json({ count });
      } catch (error) {
        await env.DB
          .prepare(
            `UPDATE clap_limits SET count = MAX(count - 1, 0)
             WHERE post_uid = ?1 AND ip_hash = ?2 AND count > 0`,
          )
          .bind(uid, ipHash)
          .run();
        throw error;
      }
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("claps error", error);
    return res.status(500).json({ error: "Internal error" });
  }
}
