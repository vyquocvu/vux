/**
 * Admin-only post creation.
 *
 * Authenticated POST: creates a new post and returns the persisted record.
 * Requires a session whose `isAdmin` flag is true (only the `OWNER_EMAIL`
 * signup ever gets that flag — see `pages/api/auth/signup.ts`).
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "utils/auth/session";
import { addPost, getPostById } from "fetcher/post";
import type { Post } from "interfaces/Post";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { env } = await getCloudflareContext({ async: true });
    const session = await getSession(req, res, env);
    if (!session.isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body ?? {};
    const post = await addPost(body as Post);
    const stored = await getPostById(post.uid, true);
    return res.status(201).json({ post: stored });
  } catch (error) {
    console.error("admin create post error", error);
    return res.status(500).json({ error: "Internal error" });
  }
}
