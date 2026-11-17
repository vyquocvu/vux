import type { NextApiRequest, NextApiResponse } from "next";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "utils/auth/session";
import { getCommentById, deleteComment } from "fetcher/comments";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");

  const { id } = req.query;
  if (typeof id !== "string" || !id) {
    return res.status(400).json({ error: "Invalid id" });
  }

  try {
    if (req.method !== "DELETE") {
      res.setHeader("Allow", "DELETE");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { env } = await getCloudflareContext({ async: true });
    const session = await getSession(req, res, env);
    if (!session.userId) {
      return res.status(401).json({ error: "Login required" });
    }

    const comment = await getCommentById(id);
    if (!comment) {
      return res.status(404).json({ error: "Not found" });
    }

    if (!session.isAdmin && comment.authorId !== session.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await deleteComment(id);
    return res.status(200).json({ status: true });
  } catch (error) {
    console.error("comment delete error", error);
    return res.status(500).json({ error: "Internal error" });
  }
}
