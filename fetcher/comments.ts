import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface Comment {
  id: string;
  postUid: string;
  authorId: string | null;
  authorName: string;
  content: string;
  createdAt: number;
}

interface CommentRow {
  id: string;
  post_uid: string;
  author_id: string | null;
  author_name: string;
  content: string;
  created_at: number;
}

const rowToComment = (row: CommentRow): Comment => ({
  id: row.id,
  postUid: row.post_uid,
  authorId: row.author_id,
  authorName: row.author_name,
  content: row.content,
  createdAt: row.created_at,
});

export const getClapCount = async (postUid: string): Promise<number> => {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const row = await env.DB
      .prepare("SELECT count FROM claps WHERE post_uid = ?1 LIMIT 1")
      .bind(postUid)
      .first<{ count: number }>();
    return row?.count ?? 0;
  } catch {
    return 0;
  }
};

export const incrementClap = async (postUid: string): Promise<number> => {
  const { env } = await getCloudflareContext({ async: true });
  await env.DB
    .prepare(
      `INSERT INTO claps (post_uid, count) VALUES (?1, 1)
       ON CONFLICT(post_uid) DO UPDATE SET count = count + 1`,
    )
    .bind(postUid)
    .run();
  const row = await env.DB
    .prepare("SELECT count FROM claps WHERE post_uid = ?1 LIMIT 1")
    .bind(postUid)
    .first<{ count: number }>();
  return row?.count ?? 0;
};

export const getComments = async (postUid: string): Promise<Comment[]> => {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const res = await env.DB
      .prepare(
        "SELECT id, post_uid, author_id, author_name, content, created_at FROM comments WHERE post_uid = ?1 ORDER BY created_at ASC",
      )
      .bind(postUid)
      .all<CommentRow>();
    return (res.results ?? []).map(rowToComment);
  } catch {
    return [];
  }
};

export const getCommentById = async (id: string): Promise<Comment | null> => {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const row = await env.DB
      .prepare("SELECT id, post_uid, author_id, author_name, content, created_at FROM comments WHERE id = ?1 LIMIT 1")
      .bind(id)
      .first<CommentRow>();
    return row ? rowToComment(row) : null;
  } catch {
    return null;
  }
};

export const addComment = async (
  postUid: string,
  data: { authorId: string | null; authorName: string; content: string },
): Promise<Comment> => {
  const { env } = await getCloudflareContext({ async: true });
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  await env.DB
    .prepare(
      `INSERT INTO comments (id, post_uid, author_id, author_name, content, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
    )
    .bind(id, postUid, data.authorId, data.authorName, data.content, now)
    .run();
  return {
    id,
    postUid,
    authorId: data.authorId,
    authorName: data.authorName,
    content: data.content,
    createdAt: now,
  };
};

export const deleteComment = async (id: string): Promise<void> => {
  const { env } = await getCloudflareContext({ async: true });
  await env.DB.prepare("DELETE FROM comments WHERE id = ?1").bind(id).run();
};

export const countRecentCommentsByUser = async (
  authorId: string,
  windowSeconds: number,
): Promise<number> => {
  const { env } = await getCloudflareContext({ async: true });
  const since = Math.floor(Date.now() / 1000) - windowSeconds;
  const row = await env.DB
    .prepare(
      "SELECT COUNT(*) as cnt FROM comments WHERE author_id = ?1 AND created_at >= ?2",
    )
    .bind(authorId, since)
    .first<{ cnt: number }>();
  return row?.cnt ?? 0;
};

export const getLastCommentByUser = async (authorId: string): Promise<Comment | null> => {
  const { env } = await getCloudflareContext({ async: true });
  const row = await env.DB
    .prepare(
      "SELECT id, post_uid, author_id, author_name, content, created_at FROM comments WHERE author_id = ?1 ORDER BY created_at DESC LIMIT 1",
    )
    .bind(authorId)
    .first<CommentRow>();
  return row ? rowToComment(row) : null;
};

export const publishedPostExists = async (postUid: string): Promise<boolean> => {
  const { env } = await getCloudflareContext({ async: true });
  const row = await env.DB
    .prepare("SELECT uid FROM posts WHERE uid = ?1 AND is_published = 1 LIMIT 1")
    .bind(postUid)
    .first<{ uid: string }>();
  return !!row;
};
