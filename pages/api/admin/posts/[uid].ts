/**
 * Admin-only post access.
 *
 *   GET    /api/admin/posts/[uid]  → fetch a single post (including drafts)
 *   PUT    /api/admin/posts/[uid]  → update an existing post
 *   DELETE /api/admin/posts/[uid]  → delete a post (and its tags by FK)
 *
 * All three require a session whose `isAdmin` flag is true. Drafts are
 * only visible to admins, so the read is also gated.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "utils/auth/session";
import { getPostById, setPostById, deletePost } from "fetcher/post";
import type { Post } from "interfaces/Post";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");

  const { uid } = req.query;
  if (typeof uid !== "string" || !uid) {
    return res.status(400).json({ error: "Invalid uid" });
  }

  try {
    const { env } = await getCloudflareContext({ async: true });
    const session = await getSession(req, res, env);
    if (!session.isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (req.method === "GET") {
      const post = await getPostById(uid, true);
      if (!post || !(post as Post).uid) {
        return res.status(404).json({ error: "Not found" });
      }
      return res.status(200).json(post);
    }

    if (req.method === "PUT") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body ?? {};
      await setPostById(uid, { ...(body as Post), uid });
      return res.status(200).json({ status: true });
    }

    if (req.method === "DELETE") {
      await deletePost(uid);
      return res.status(200).json({ status: true });
    }

    res.setHeader("Allow", "GET, PUT, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("admin post mutation error", error);
    return res.status(500).json({ error: "Internal error" });
  }
}
