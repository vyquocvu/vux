/**
 * Admin post list + creation.
 *
 *   GET  → all posts (including drafts), bodies omitted
 *   POST → create a post
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "utils/auth/session";
import { addPost, getAllPostsForAdmin, getPostById } from "fetcher/post";
import type { Post } from "interfaces/Post";

const listShape = (posts: Post[]) =>
  posts.map((post) => ({
    uid: post.uid,
    slug: post.slug,
    title: post.title,
    thumbText: post.thumbText,
    thumbImage: post.thumbImage,
    isPublished: post.isPublished,
    author: post.author,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    tags: post.tags ?? [],
  }));

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");

  try {
    const { env } = await getCloudflareContext({ async: true });
    const session = await getSession(req, res, env);
    if (!session.isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (req.method === "GET") {
      const posts = await getAllPostsForAdmin();
      return res.status(200).json({ posts: listShape(posts) });
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body ?? {};
      const post = await addPost(body as Post);
      const stored = await getPostById(post.uid, true);
      return res.status(201).json({ post: stored });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("admin posts error", error);
    return res.status(500).json({ error: "Internal error" });
  }
}
