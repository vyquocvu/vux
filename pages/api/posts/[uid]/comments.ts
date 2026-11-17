import type { NextApiRequest, NextApiResponse } from "next";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "utils/auth/session";
import { getComments, addComment, countRecentCommentsByUser, getLastCommentByUser, publishedPostExists, deleteComment } from "fetcher/comments";

const MAX_NAME = 40;

const publicName = (displayName?: string | null, email?: string): string => {
  const raw = (displayName || email?.split("@")[0] || "Anonymous")
    .replace(/[\u0000-\u001f]/g, " ")
    .trim();
  return raw.slice(0, MAX_NAME) || "Anonymous";
};

const MAX_CONTENT_LENGTH = 2000;
const MIN_CONTENT_LENGTH = 2;
const RATE_LIMIT_WINDOW = 60;
const RATE_LIMIT_MAX = 5;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");

  const { uid } = req.query;
  if (typeof uid !== "string" || !uid) {
    return res.status(400).json({ error: "Invalid uid" });
  }

  try {
    if (req.method === "GET") {
      if (!(await publishedPostExists(uid))) {
        return res.status(404).json({ error: "Not found" });
      }
      const comments = await getComments(uid);
      return res.status(200).json({ comments });
    }

    if (req.method === "POST") {
      const { env } = await getCloudflareContext({ async: true });
      const session = await getSession(req, res, env);
      if (!session.userId) {
        return res.status(401).json({ error: "Login required" });
      }
      if (!(await publishedPostExists(uid))) {
        return res.status(404).json({ error: "Not found" });
      }

      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body ?? {};
      const { content } = body as { content?: string };
      const trimmed = content?.trim() ?? "";

      if (trimmed.length < MIN_CONTENT_LENGTH) {
        return res.status(400).json({ error: `Content must be at least ${MIN_CONTENT_LENGTH} characters` });
      }
      if (trimmed.length > MAX_CONTENT_LENGTH) {
        return res.status(400).json({ error: `Content must be under ${MAX_CONTENT_LENGTH} characters` });
      }

      const recentCount = await countRecentCommentsByUser(session.userId, RATE_LIMIT_WINDOW);
      if (recentCount >= RATE_LIMIT_MAX) {
        return res.status(429).json({ error: "Too many comments. Please wait a moment." });
      }

      const last = await getLastCommentByUser(session.userId);
      if (last && last.content === trimmed) {
        return res.status(400).json({ error: "Duplicate comment" });
      }

      const authorName = publicName(session.displayName, session.email);
      const comment = await addComment(uid, {
        authorId: session.userId,
        authorName,
        content: trimmed,
      });
      // The pre-check above is racy. Drop the row if this request landed past the cap.
      const after = await countRecentCommentsByUser(session.userId, RATE_LIMIT_WINDOW);
      if (after > RATE_LIMIT_MAX) {
        await deleteComment(comment.id);
        return res.status(429).json({ error: "Too many comments. Please wait a moment." });
      }
      return res.status(201).json({ comment });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("comments error", error);
    return res.status(500).json({ error: "Internal error" });
  }
}
