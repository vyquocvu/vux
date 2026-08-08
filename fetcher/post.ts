/**
 * Post fetcher backed by Cloudflare D1.
 *
 * Replaces the original Firestore-backed fetcher. Works in three contexts:
 *   • runtime requests (OpenNext Worker): `getCloudflareContext()` is sync
 *   • `next dev`:                      needs `initOpenNextCloudflareForDev()`
 *     in `next.config.js`
 *   • build-time SSG (`getStaticProps`): async fallback via wrangler's
 *     platform proxy
 *
 * We always ask for `{ async: true }` so the same code path works in all three.
 */
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Post } from "interfaces/Post";

interface PostRow {
  uid: string;
  slug: string;
  title: string;
  thumb_text: string | null;
  thumb_image: string | null;
  publish_content: string | null;
  draft_content: string | null;
  is_published: number;
  author_id: string | null;
  created_at: number;
  updated_at: number;
  position: number;
}

const rowToPost = (row: PostRow, opts: { includeDrafts?: boolean } = {}): Post => ({
  uid: row.uid,
  slug: row.slug,
  url: `/post/${row.slug}`,
  title: row.title,
  tags: [],
  thumbText: row.thumb_text ?? "",
  thumbImage: row.thumb_image ?? "",
  publishContent: row.publish_content ?? "",
  draftContent: opts.includeDrafts ? row.draft_content ?? "" : "",
  isPublished: row.is_published === 1,
  author: row.author_id ?? "",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

async function loadTags(env: any, postUid: string): Promise<string[]> {
  const { results } = (await env.DB
    .prepare("SELECT tag FROM tags WHERE post_uid = ?1 ORDER BY tag")
    .bind(postUid)
    .all()) as { results?: { tag: string }[] };
  return (results ?? []).map((r: { tag: string }) => r.tag);
}

export const getPostById = async (uid: string, isEdit = false): Promise<Post | Record<string, never>> => {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const row = await env.DB
      .prepare("SELECT * FROM posts WHERE uid = ?1 LIMIT 1")
      .bind(uid)
      .first<PostRow>();
    if (!row) return {};
    const post = rowToPost(row, { includeDrafts: isEdit });
    post.tags = await loadTags(env, row.uid);
    return post;
  } catch (error) {
    console.error("getPostById failed", error);
    return {};
  }
};

export const setPostById = async (uid: string, postData: Post): Promise<void> => {
  const { env } = await getCloudflareContext({ async: true });
  await env.DB
    .prepare(
      `INSERT INTO posts (uid, slug, title, thumb_text, thumb_image, publish_content, draft_content, is_published, author_id, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
       ON CONFLICT(uid) DO UPDATE SET
         slug = excluded.slug,
         title = excluded.title,
         thumb_text = excluded.thumb_text,
         thumb_image = excluded.thumb_image,
         publish_content = excluded.publish_content,
         draft_content = excluded.draft_content,
         is_published = excluded.is_published,
         author_id = excluded.author_id,
         updated_at = excluded.updated_at`,
    )
    .bind(
      uid,
      postData.slug ?? "",
      postData.title,
      postData.thumbText ?? "",
      postData.thumbImage ?? "",
      postData.publishContent ?? "",
      postData.draftContent ?? "",
      postData.isPublished ? 1 : 0,
      postData.author ?? null,
      Math.floor(postData.createdAt ?? Date.now() / 1000),
      Math.floor(Date.now() / 1000),
    )
    .run();

  // Tags
  await env.DB.prepare("DELETE FROM tags WHERE post_uid = ?1").bind(uid).run();
  for (const tag of postData.tags ?? []) {
    await env.DB
      .prepare("INSERT OR IGNORE INTO tags (post_uid, tag) VALUES (?1, ?2)")
      .bind(uid, tag)
      .run();
  }
};

export const getPublishedPosts = async (): Promise<Post[]> => {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const res = await env.DB
      .prepare(
        "SELECT * FROM posts WHERE is_published = 1 ORDER BY created_at DESC, position ASC",
      )
      .all<PostRow>();
    const rows = res.results ?? [];
    const posts: Post[] = [];
    for (const row of rows) {
      const post = rowToPost(row);
      post.tags = await loadTags(env, row.uid);
      posts.push(post);
    }
    return posts;
  } catch (error) {
    console.error("getPublishedPosts failed", error);
    return [];
  }
};

export const getPostsByUserId = async (userId: string): Promise<Post[]> => {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const res = await env.DB
      .prepare(
        "SELECT * FROM posts WHERE author_id = ?1 ORDER BY created_at DESC",
      )
      .bind(userId)
      .all<PostRow>();
    const rows = res.results ?? [];
    const posts: Post[] = [];
    for (const row of rows) {
      const post = rowToPost(row, { includeDrafts: true });
      post.tags = await loadTags(env, row.uid);
      posts.push(post);
    }
    return posts;
  } catch (error) {
    console.error("getPostsByUserId failed", error);
    return [];
  }
};

export const addPost = async (postData: Post): Promise<Post> => {
  const uid = postData.uid && postData.uid !== "creating-post"
    ? postData.uid
    : crypto.randomUUID();
  await setPostById(uid, { ...postData, uid });
  return (await getPostById(uid, true)) as Post;
};

export const deletePost = async (uid: string): Promise<void> => {
  const { env } = await getCloudflareContext({ async: true });
  await env.DB.prepare("DELETE FROM posts WHERE uid = ?1").bind(uid).run();
  await env.DB.prepare("DELETE FROM tags WHERE post_uid = ?1").bind(uid).run();
};
