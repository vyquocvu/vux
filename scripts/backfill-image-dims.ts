/**
 * Bake intrinsic image dimensions and loading hints into the HTML already
 * stored in D1, and repoint the legacy raster seeds at their WebP replacements.
 *
 *   node --experimental-strip-types scripts/backfill-image-dims.ts [--remote] [--dry-run]
 *
 * Reads every post, rewrites `publish_content` and `draft_content` through
 * `utils/images/content.ts`, and writes back only the rows that actually
 * changed, so a second run is a no-op. Dimensions come from `seeds/images/`
 * when the file is tracked there and from R2 otherwise.
 */
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { basename, resolve } from "node:path";
import { argv, exit } from "node:process";
import { annotateContentImages } from "../utils/images/content.ts";
import { readDimensions } from "../utils/images/dims.ts";
import type { Dimensions } from "../utils/images/dims.ts";

const USE_REMOTE = argv.includes("--remote");
const DRY_RUN = argv.includes("--dry-run");
const TARGET = USE_REMOTE ? "--remote" : "--local";
const SEEDS = resolve(import.meta.dirname, "..", "seeds");
const SEED_IMAGE_DIR = resolve(SEEDS, "images");
const MIGRATION_PATH = resolve(SEEDS, "image-webp-migration.json");
const BUDGET_BYTES = 900_000; // wrangler caps one --file request at 1 MiB

const run = (args: string[]): string => {
  const r = spawnSync("npx", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
  if (r.status !== 0) throw new Error(`wrangler failed: ${args.join(" ")}\n${r.stderr ?? ""}`);
  return r.stdout ?? "";
};

const d1 = (command: string): any[] => {
  const out = run(["wrangler", "d1", "execute", "vux", TARGET, "--json", `--command=${command}`]);
  const start = out.search(/[[{]/);
  if (start < 0) throw new Error("no JSON in wrangler output:\n" + out.slice(0, 400));
  const parsed = JSON.parse(out.slice(start));
  return Array.isArray(parsed) ? parsed : [parsed];
};

const escape = (s: string): string => s.replace(/'/g, "''");

const migration: Record<string, string> = existsSync(MIGRATION_PATH)
  ? JSON.parse(readFileSync(MIGRATION_PATH, "utf8"))
  : {};

const dimsCache = new Map<string, Dimensions | null>();
const scratch = mkdtempSync(resolve(tmpdir(), "vux-backfill-"));

const fromR2 = (key: string): Dimensions | null => {
  const dest = resolve(scratch, `${dimsCache.size}.bin`);
  try {
    run(["wrangler", "r2", "object", "get", `vux-media/${key}`, `--file=${dest}`, TARGET]);
    const buf = readFileSync(dest);
    return buf.length ? readDimensions(new Uint8Array(buf)) : null;
  } catch {
    return null;
  } finally {
    rmSync(dest, { force: true });
  }
};

const lookup = (src: string): Dimensions | null => {
  const clean = src.split("?")[0].split("#")[0];
  if (!clean.startsWith("/images/")) return null;
  const key = clean.slice(1);
  if (dimsCache.has(key)) return dimsCache.get(key)!;

  const seedPath = resolve(SEED_IMAGE_DIR, basename(key));
  const dims = existsSync(seedPath)
    ? readDimensions(new Uint8Array(readFileSync(seedPath)))
    : fromR2(key);
  dimsCache.set(key, dims);
  return dims;
};

const remap = (html: string): { html: string; hits: number } => {
  let out = html;
  let hits = 0;
  for (const [from, to] of Object.entries(migration)) {
    const parts = out.split(`/images/${from}`);
    if (parts.length > 1) {
      hits += parts.length - 1;
      out = parts.join(`/images/${to}`);
    }
  }
  return { html: out, hits };
};

interface Row {
  uid: string;
  thumb_image: string | null;
  publish_content: string | null;
  draft_content: string | null;
}

const main = async () => {
  const rows = d1(
    "SELECT uid, thumb_image, publish_content, draft_content FROM posts;",
  )[0]?.results as Row[] | undefined;
  if (!rows?.length) {
    console.log("[backfill] no rows — nothing to do");
    return;
  }

  const updates: string[] = [];
  let postsChanged = 0;
  let imgsRewritten = 0;
  let refsRemapped = 0;
  const unresolved = new Set<string>();

  for (const row of rows) {
    let changed = false;
    const cols: string[] = [];

    const thumb = remap(row.thumb_image ?? "");
    refsRemapped += thumb.hits;
    if (thumb.html !== (row.thumb_image ?? "")) {
      cols.push(`thumb_image = '${escape(thumb.html)}'`);
      changed = true;
    }

    for (const col of ["publish_content", "draft_content"] as const) {
      const before = row[col] ?? "";
      const mapped = remap(before);
      refsRemapped += mapped.hits;
      const after = annotateContentImages(mapped.html, (src) => {
        const d = lookup(src);
        if (!d && src.startsWith("/images/")) unresolved.add(src);
        return d;
      });
      if (after !== before) {
        imgsRewritten += (after.match(/<img\b/gi) ?? []).length;
        cols.push(`${col} = '${escape(after)}'`);
        changed = true;
      }
    }

    if (changed) {
      postsChanged += 1;
      updates.push(
        `UPDATE posts SET ${cols.join(", ")} WHERE uid = '${escape(row.uid)}';`,
      );
    }
  }

  console.log(
    `[backfill] ${rows.length} posts scanned · ${postsChanged} changed · ` +
      `${imgsRewritten} <img> rewritten · ${refsRemapped} refs remapped · ` +
      `${unresolved.size} unresolved srcs`,
  );
  if (unresolved.size) {
    for (const s of [...unresolved].slice(0, 10)) console.log(`[backfill]   unresolved: ${s}`);
  }

  if (!updates.length) {
    console.log("[backfill] database already annotated, no writes");
    return;
  }
  if (DRY_RUN) {
    const dest = resolve(SEEDS, "backfill-preview.sql");
    writeFileSync(dest, updates.join("\n"), "utf8");
    console.log(`[backfill] --dry-run: wrote ${updates.length} statements to ${dest}`);
    return;
  }

  // Chunk so no single request crosses wrangler's payload cap.
  let batch: string[] = [];
  let size = 0;
  let part = 0;
  const flush = () => {
    if (!batch.length) return;
    const file = resolve(scratch, `backfill.${part++}.sql`);
    writeFileSync(file, batch.join("\n"), "utf8");
    run(["wrangler", "d1", "execute", "vux", TARGET, `--file=${file}`]);
    rmSync(file, { force: true });
    batch = [];
    size = 0;
  };
  for (const stmt of updates) {
    const n = Buffer.byteLength(stmt, "utf8");
    if (size + n > BUDGET_BYTES) flush();
    batch.push(stmt);
    size += n;
  }
  flush();
  console.log(`[backfill] applied ${postsChanged} updates in ${part} batch(es)`);
};

main()
  .catch((err) => {
    console.error("[backfill] failed:", err instanceof Error ? err.message : err);
    exit(1);
  })
  .finally(() => rmSync(scratch, { recursive: true, force: true }));
