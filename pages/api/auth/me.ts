import type { NextApiRequest, NextApiResponse } from "next";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "utils/auth/session";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  try {
    const { env } = await getCloudflareContext({ async: true });
    const session = await getSession(req, res, env);
    if (!session.userId) {
      return res.status(200).json({ authUser: null });
    }
    return res.status(200).json({
      authUser: {
        id: session.userId,
        email: session.email,
        displayName: session.displayName ?? null,
        isAdmin: !!session.isAdmin,
      },
    });
  } catch (error) {
    console.error("me error", error);
    return res.status(500).json({ error: "Internal error" });
  }
}
