/**
 * Fail loudly when a published post references an image the site cannot serve.
 *
 *   node --experimental-strip-types scripts/verify-image-refs.ts [--local]
 *
 * Reads every published row from D1 (remote by default), collects the
 * `/images/*` srcs from `thumb_image` and `publish_content`, then HEADs each
 * one against the live origin — the same path a browser takes, so R2 misses,
 * half-finished uploads and stale migration targets all surface here. Exits 1
 * when anything is missing, which makes it usable as a CI gate.
 */
import { spawnSync } from "node:child_process";
import { argv, env, exit } from "node:process";

const USE_LOCAL = argv.includes("--local");
const TARGET = USE_LOCAL ? "--local" : "--remote";
const BASE = env.BASE || (USE_LOCAL ? "http://localhost:3000" : "https://www.vyquocvu.com");
const CONCURRENCY = 8;

const run = (args: string[]): string => {
  const r = spawnSync("npx", args, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
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

interface Row {
  slug: string;
  thumb_image: string | null;
  publish_content: string | null;
}

const srcsOf = (row: Row): string[] => {
  const found = new Set<string>();
  for (const col of [row.thumb_image ?? "", row.publish_content ?? ""]) {
    for (const m of col.matchAll(/\/images\/[^"'()\s]+/g)) found.add(m[0]);
  }
  return [...found];
};

const status = async (path: string): Promise<number> => {
  try {
    const res = await fetch(BASE + path, { method: "HEAD", redirect: "manual" });
    return res.status;
  } catch {
    return 0;
  }
};

const pool = async <T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> => {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
};

const stemOf = (src: string): string => {
  const key = src.slice("/images/".length).split("?")[0];
  const dot = key.lastIndexOf(".");
  return dot < 0 ? key : key.slice(0, dot);
};

const VARIANTS = [".webp", ".avif", ".png", ".jpg", ".jpeg", ".gif"];

const main = async () => {
  const rows = d1(
    "SELECT slug, thumb_image, publish_content FROM posts WHERE is_published = 1;",
  )[0]?.results as Row[] | undefined;
  if (!rows?.length) {
    console.log(`[image-refs] no published rows in ${TARGET} D1 — nothing to check`);
    return;
  }

  const owners = new Map<string, Set<string>>();
  for (const row of rows) {
    for (const src of srcsOf(row)) {
      if (!owners.has(src)) owners.set(src, new Set());
      owners.get(src)!.add(row.slug);
    }
  }
  const refs = [...owners.keys()].sort();
  const codes = await pool(refs, CONCURRENCY, status);

  const missing: { src: string; code: number; slugs: string[]; alt: string | null }[] = [];
  for (let i = 0; i < refs.length; i++) {
    if (codes[i] === 200) continue;
    const src = refs[i];
    let alt: string | null = null;
    for (const ext of VARIANTS) {
      const candidate = `/images/${stemOf(src)}${ext}`;
      if (candidate !== src && (await status(candidate)) === 200) {
        alt = candidate;
        break;
      }
    }
    missing.push({ src, code: codes[i], slugs: [...owners.get(src)!], alt });
  }

  console.log(
    `[image-refs] ${BASE} · ${rows.length} posts · ${refs.length} unique refs · ` +
      `${refs.length - missing.length} ok · ${missing.length} missing`,
  );
  if (!missing.length) return;

  for (const m of missing) {
    console.log(`[image-refs] ${m.code} ${m.src}`);
    console.log(`             posts: ${m.slugs.join(", ")}`);
    console.log(
      m.alt
        ? `             served variant exists: ${m.alt} — repoint the content or upload ${m.src}`
        : `             no variant resolves — upload the object`,
    );
  }
  exit(1);
};

main().catch((err) => {
  console.error("[image-refs] failed:", err instanceof Error ? err.message : err);
  exit(1);
});
