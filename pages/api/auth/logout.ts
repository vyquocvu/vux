import type { NextApiRequest, NextApiResponse } from "next";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { logout as clearSession } from "utils/auth/session";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { env } = await getCloudflareContext({ async: true });
    await clearSession(req, res, env);
    return res.status(200).json({ status: true });
  } catch (error) {
    console.error("logout error", error);
    return res.status(500).json({ error: "Internal error" });
  }
}
