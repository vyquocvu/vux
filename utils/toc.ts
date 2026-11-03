/**
 * Build-time table of contents for article bodies stored as Quill HTML.
 *
 * Unlike `annotateContentImages` (write-time, persisted), this runs on read in
 * `getStaticProps`: no migration of the 47 existing posts, and a slug-algorithm
 * change only needs a revalidate. Idempotent — an `id` already in the content
 * wins and is never overwritten, so author deep links stay stable.
 */
import { parseAttrs, serializeTag, stripTags } from "./html.ts";

export interface TocEntry {
  id: string;
  label: string;
  level: 2 | 3 | 4;
}

export interface TocResult {
  html: string;
  toc: TocEntry[];
  minutes: number;
}

const WORDS_PER_MINUTE = 200;

/** Vietnamese-aware slug. Keeps digits, which `friendlyStr` drops. */
export function headingSlug(text: string, seen: Set<string>): string {
  const base =
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "section";

  let slug = base;
  let n = 2;
  while (seen.has(slug)) slug = `${base}-${n++}`;
  seen.add(slug);
  return slug;
}

export function buildToc(html: string): TocResult {
  if (!html) return { html: "", toc: [], minutes: 1 };

  const seen = new Set<string>();
  const toc: TocEntry[] = [];

  const withIds = html.replace(
    /<(h[2-4])\b([^>]*)>([\s\S]*?)<\/\1>/gi,
    (whole, name: string, rawAttrs: string, inner: string) => {
      const tag = name.toLowerCase();
      const label = stripTags(inner);
      // An empty heading is a Quill artifact; leaving it alone keeps the body
      // byte-identical and the rail's `>= 2` filter never sees it.
      if (!label) return whole;

      const attrs = parseAttrs(`<${tag}${rawAttrs}>`);
      const existing = attrs.get("id")?.value;
      const id = existing || headingSlug(label, seen);
      if (existing) seen.add(existing);
      else attrs.set("id", { value: id, quote: '"' });

      toc.push({ id, label, level: Number(name[1]) as 2 | 3 | 4 });
      return `${serializeTag(tag, attrs)}${inner}</${tag}>`;
    },
  );

  const words = stripTags(withIds).split(" ").filter(Boolean).length;
  return {
    html: withIds,
    toc,
    minutes: Math.max(1, Math.ceil(words / WORDS_PER_MINUTE)),
  };
}
