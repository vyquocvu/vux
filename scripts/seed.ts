/**
 * Loads `seeds/posts.json` and `seeds/images/*` into the local (or remote)
 * Cloudflare D1 + R2 bindings for the Vux blog.
 *
 * Run with `node --experimental-strip-types scripts/seed.ts` (Node 22+ has
 * native .ts support).
 *
 * For remote mode (`--remote`) this calls the Cloudflare REST API directly
 * using `wrangler`'s discovered account ID and credentials.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, basename } from "node:path";
import { argv, exit } from "node:process";

interface SeedPost {
  uid: string;
  slug: string;
  title: string;
  tags: string[];
  thumbText: string;
  thumbImage: string;
  publishContent: string;
  publishedLabel: string;
  images: { key: string; src: string }[];
  sourceUrl: string;
}

interface SeedImage {
  key: string;
  buf: Uint8Array;
}

const SEEDS = resolve(import.meta.dirname, "..", "seeds");
const POSTS_PATH = resolve(SEEDS, "posts.json");
const IMAGES_DIR = resolve(SEEDS, "images");
const SCHEMA_PATH = resolve(SEEDS, "schema.sql");

const LABEL_RE = /^(\d+)\s+(\w+)\s+ago$/;

const labelToSeconds = (label: string): number => {
  const m = LABEL_RE.exec(label.trim().toLowerCase());
  if (!m) return Math.floor(Date.now() / 1000);
  const n = parseInt(m[1], 10);
  const rawUnit = m[2];
  // The label uses plural ("3 years ago") but our factor table is keyed
  // singular. Strip the trailing "s" so both forms resolve.
  const unit = rawUnit.endsWith("s") ? rawUnit.slice(0, -1) : rawUnit;
  const factor: Record<string, number> = {
    second: 1, minute: 60, hour: 3600, day: 86400, week: 604800,
    month: 2592000, year: 31536000,
  };
  return Math.floor((Date.now() - n * (factor[unit] ?? 86400)) / 1000);
};

const loadPosts = (): SeedPost[] =>
  JSON.parse(readFileSync(POSTS_PATH, "utf8")) as SeedPost[];

const loadImages = (): SeedImage[] =>
  readdirSync(IMAGES_DIR)
    .filter((f) => !f.startsWith("."))
    .map((f) => ({
      key: `images/${f}`,
      buf: new Uint8Array(readFileSync(resolve(IMAGES_DIR, f))),
    }));

const ownerEmail = process.env.OWNER_EMAIL ?? "vyquocvu@gmail.com";

const useRemote = argv.includes("--remote");

const escape = (s: string): string => s.replace(/'/g, "''");

const contentTypeFor = (key: string): string => {
  const ext = key.slice(key.lastIndexOf(".") + 1).toLowerCase();
  switch (ext) {
    case "webp": return "image/webp";
    case "png": return "image/png";
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "svg": return "image/svg+xml";
    case "avif": return "image/avif";
    case "gif": return "image/gif";
    case "mp3": return "audio/mpeg";
    case "wav": return "audio/wav";
    case "m4a": return "audio/mp4";
    case "ogg": return "audio/ogg";
    case "mp4": return "video/mp4";
    default: return "application/octet-stream";
  }
};

// ----- Local mode: talk to Miniflare through wrangler's headless driver ----
// For simplicity we shell out to wrangler.

const run = (cmd: string, args: string[]): string => {
  const result = spawnSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed: ${result.stderr}`);
  }
  return result.stdout;
};

const seedLocal = () => {
  // Apply schema
  run("npx", [
    "wrangler",
    "d1",
    "execute",
    "vux",
    "--local",
    `--file=${SCHEMA_PATH}`,
  ]);
  console.log("[seed] applied schema (local)");

  // Insert posts
  const posts = loadPosts();
  const inserts: string[] = [];
  posts.forEach((p, idx) => {
    const created = labelToSeconds(p.publishedLabel);
    const updated = created; // we don't have per-post updated
    const position = idx; // order in posts.json = legacy homepage order; tiebreaks equal labels
    const slug = escape(p.slug);
    const title = escape(p.title);
    const thumbText = escape(p.thumbText ?? "");
    const thumbImage = escape(p.thumbImage ?? "");
    const publishContent = escape(p.publishContent ?? "");
    const draftContent = escape(p.publishContent ?? "");
    inserts.push(
      `INSERT OR IGNORE INTO posts (uid, slug, title, thumb_text, thumb_image, publish_content, draft_content, is_published, created_at, updated_at, position) VALUES ('${p.uid}', '${slug}', '${title}', '${thumbText}', '${thumbImage}', '${publishContent}', '${draftContent}', 1, ${created}, ${updated}, ${position});`,
    );
  });
  const sql = inserts.join("\n");
  const seedFile = resolve(SEEDS, "posts.insert.sql");
  writeFileSync(seedFile, sql, "utf8");
  run("npx", [
    "wrangler",
    "d1",
    "execute",
    "vux",
    "--local",
    `--file=${seedFile}`,
  ]);
  console.log(`[seed] inserted ${posts.length} posts (local)`);

  // Upload images via wrangler R2. We upload each images/<key> file.
  const images = loadImages();
  console.log(`[seed] uploading ${images.length} images to local R2 bucket`);
  for (const img of images) {
    const filePath = resolve(IMAGES_DIR, basename(img.key));
    run("npx", [
      "wrangler",
      "r2",
      "object",
      "put",
      "--local",
      `vux-media/${img.key}`,
      `--file=${filePath}`,
    ]);
  }
  console.log("[seed] uploads complete (local)");
};

const seedRemote = async () => {
  // Apply schema
  run("npx", [
    "wrangler",
    "d1",
    "execute",
    "vux",
    "--remote",
    `--file=${SCHEMA_PATH}`,
  ]);
  console.log("[seed] applied schema (remote)");

  const posts = loadPosts();
  const lines: string[] = [];
  posts.forEach((p, idx) => {
    const created = labelToSeconds(p.publishedLabel);
    const updated = created;
    const position = idx; // tiebreak for posts that share a publishedLabel
    lines.push(
      `INSERT OR IGNORE INTO posts (uid, slug, title, thumb_text, thumb_image, publish_content, draft_content, is_published, created_at, updated_at, position) VALUES ('${p.uid}', '${escape(p.slug)}', '${escape(p.title)}', '${escape(p.thumbText ?? "")}', '${escape(p.thumbImage ?? "")}', '${escape(p.publishContent ?? "")}', '${escape(p.publishContent ?? "")}', 1, ${created}, ${updated}, ${position});`,
    );
  });
  const seedFile = resolve(SEEDS, "posts.insert.sql");
  writeFileSync(seedFile, lines.join("\n"), "utf8");

  // wrangler d1 execute --file= caps a request at 1 MiB; our seed is ~635 KB
  // for 47 posts so a single call is sufficient. If you scale up, batch by
  // statement and call --command per row.
  const size = readFileSync(seedFile).byteLength;
  console.log(`[seed] inserting ${posts.length} posts (${(size / 1024).toFixed(1)} KB)`);
  run("npx", [
    "wrangler",
    "d1",
    "execute",
    "vux",
    "--remote",
    `--file=${seedFile}`,
  ]);
  console.log(`[seed] inserted ${posts.length} posts (remote)`);

  // Upload images
  const images = loadImages();
  console.log(`[seed] uploading ${images.length} images to remote R2`);
  for (const img of images) {
    const filePath = resolve(IMAGES_DIR, basename(img.key));
    run("npx", [
      "wrangler",
      "r2",
      "object",
      "put",
      "--remote",
      `vux-media/${img.key}`,
      `--file=${filePath}`,
      `--content-type=${contentTypeFor(img.key)}`,
    ]);
  }
  console.log("[seed] uploads complete (remote)");
};

const main = async () => {
  if (useRemote) await seedRemote();
  else seedLocal();
};

main().catch((err) => {
  console.error(err);
  exit(1);
});
